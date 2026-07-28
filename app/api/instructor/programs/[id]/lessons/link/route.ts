import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { copyStreamFromUrl } from "@/lib/cloudflare-stream";
import { PROGRAM_CAPS, storedUploadSeconds } from "@/lib/programs";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/lessons/link  { title, url }
 *
 * "Add a lesson from a link": Cloudflare pulls the video from the URL
 * server-side (nothing passes through us or the instructor's device). Google
 * Drive share links are resolved to a direct download via the Drive API —
 * the file must be shared "anyone with the link". Everything downstream
 * (processing badge, promotion to a lesson, auto-thumbnail) is the same
 * pipeline as a direct upload.
 */

/** Extract the file id from the common Drive share-link shapes. */
function driveFileId(url: URL): string | null {
  if (!/(^|\.)drive\.google\.com$/.test(url.hostname)) return null;
  const pathMatch = url.pathname.match(/\/file\/d\/([\w-]+)/);
  if (pathMatch) return pathMatch[1];
  const idParam = url.searchParams.get("id");
  return idParam && /^[\w-]+$/.test(idParam) ? idParam : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { program, instructorId } = auth.ctx;

    const data = await request.json().catch(() => null);
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    if (!title || title.length > 255) {
      return NextResponse.json(
        { error: "Lesson title is required (up to 255 characters)." },
        { status: 400 }
      );
    }

    let url: URL;
    try {
      url = new URL(typeof data?.url === "string" ? data.url.trim() : "");
    } catch {
      return NextResponse.json(
        { error: "Please paste a valid link to the video." },
        { status: 400 }
      );
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return NextResponse.json(
        { error: "Please paste a valid link to the video." },
        { status: 400 }
      );
    }

    // Google Drive share link → direct download via the Drive API.
    let fetchUrl = url.toString();
    const fileId = driveFileId(url);
    if (fileId) {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Google Drive links aren't set up yet. Please paste a direct video link instead.",
          },
          { status: 400 }
        );
      }
      // Confirm the file is link-public before handing it to Cloudflare, so
      // the instructor gets a clear message instead of a silent failure.
      const meta = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType&key=${apiKey}`
      );
      if (!meta.ok) {
        return NextResponse.json(
          {
            error:
              'We can\'t read that Google Drive file. In Drive, set the video to "Anyone with the link" and try again.',
          },
          { status: 400 }
        );
      }
      fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    }

    const db = getServiceRoleClient();

    // Same caps as direct uploads.
    const [{ count: itemCount }, { count: inflightCount }] = await Promise.all([
      db
        .from("product_items")
        .select("content_id", { count: "exact", head: true })
        .eq("product_id", program.id),
      db
        .from("program_uploads")
        .select("id", { count: "exact", head: true })
        .eq("product_id", program.id)
        .in("status", ["uploading", "processing"]),
    ]);
    if ((itemCount ?? 0) + (inflightCount ?? 0) >= PROGRAM_CAPS.maxLessonsPerProgram) {
      return NextResponse.json(
        { error: `A program can have up to ${PROGRAM_CAPS.maxLessonsPerProgram} lessons.` },
        { status: 400 }
      );
    }
    const usedSeconds = await storedUploadSeconds(instructorId);
    if (usedSeconds >= PROGRAM_CAPS.maxStoredMinutesPerInstructor * 60) {
      return NextResponse.json(
        {
          error: `You've reached the ${PROGRAM_CAPS.maxStoredMinutesPerInstructor}-minute video storage limit. Remove unused lessons or contact us for more space.`,
        },
        { status: 400 }
      );
    }

    const { uid } = await copyStreamFromUrl({
      url: fetchUrl,
      maxDurationSeconds: PROGRAM_CAPS.maxLessonSeconds,
      creator: instructorId,
      name: title,
    });

    const { error } = await db.from("program_uploads").insert({
      instructor_id: instructorId,
      product_id: program.id,
      cloudflare_uid: uid,
      title,
      status: "processing",
    });
    if (error) {
      console.error("program_uploads insert failed:", error);
      return NextResponse.json(
        { error: "Failed to start the import. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ uid });
  } catch (error) {
    console.error("Lesson link import error:", error);
    return NextResponse.json(
      { error: "Failed to start the import. Please try again." },
      { status: 500 }
    );
  }
}
