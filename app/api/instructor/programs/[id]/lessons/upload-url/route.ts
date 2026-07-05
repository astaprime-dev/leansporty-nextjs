import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { createDirectUploadTus } from "@/lib/cloudflare-stream";
import { PROGRAM_CAPS, storedUploadSeconds } from "@/lib/programs";

export const runtime = "nodejs";

/**
 * 20GB — real lesson masters run 6–11GB (21-Day Challenge sources). Cloudflare
 * tus accepts up to 30GB, and storage is billed per MINUTE (the 600-min cap),
 * not per byte, so a high ceiling costs nothing extra.
 */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 * 1024;

/**
 * POST /api/instructor/programs/[id]/lessons/upload-url
 * { title, fileSizeBytes }
 *
 * Checks the caps, mints a one-time Cloudflare tus upload URL (with
 * requireSignedURLs + max duration locked in), and records the attempt in
 * program_uploads. The browser uploads directly to Cloudflare; the lesson
 * appears via the status route once Cloudflare reports it ready.
 */
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
    const fileSizeBytes = Number(data?.fileSizeBytes);
    if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0) {
      return NextResponse.json({ error: "fileSizeBytes required" }, { status: 400 });
    }
    if (fileSizeBytes > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Video files must be 20GB or smaller." },
        { status: 400 }
      );
    }

    const db = getServiceRoleClient();

    // Cap: lessons per program (uploads in flight count via program_uploads).
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

    // Cap: stored minutes per instructor.
    const usedSeconds = await storedUploadSeconds(instructorId);
    if (usedSeconds >= PROGRAM_CAPS.maxStoredMinutesPerInstructor * 60) {
      return NextResponse.json(
        {
          error: `You've reached the ${PROGRAM_CAPS.maxStoredMinutesPerInstructor}-minute video storage limit. Remove unused lessons or contact us for more space.`,
        },
        { status: 400 }
      );
    }

    const { uploadUrl, uid } = await createDirectUploadTus({
      uploadLengthBytes: fileSizeBytes,
      maxDurationSeconds: PROGRAM_CAPS.maxLessonSeconds,
      creator: instructorId,
      name: title,
    });

    const { error } = await db.from("program_uploads").insert({
      instructor_id: instructorId,
      product_id: program.id,
      cloudflare_uid: uid,
      title,
      status: "uploading",
    });
    if (error) {
      console.error("program_uploads insert failed:", error);
      return NextResponse.json(
        { error: "Failed to start the upload. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadUrl, uid });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "Failed to start the upload. Please try again." },
      { status: 500 }
    );
  }
}
