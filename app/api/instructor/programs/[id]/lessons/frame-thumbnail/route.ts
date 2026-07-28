import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { uploadImage } from "@/lib/cloudflare-images";
import { getVideoDetails, signStreamToken } from "@/lib/cloudflare-stream";

export const runtime = "nodejs";

/**
 * Frame-picker backend for lesson thumbnails: Cloudflare Stream renders a
 * frame at any timestamp via .../thumbnails/thumbnail.jpg?time=Ns. Signed
 * videos need the token-in-path form, so the preview base is minted here
 * server-side and the chosen frame is copied to Cloudflare Images (a Stream
 * URL would stop working once the token expires).
 */

async function lessonVideo(programId: string, contentId: string) {
  const db = getServiceRoleClient();
  const { data: item } = await db
    .from("product_items")
    .select("content_id")
    .eq("product_id", programId)
    .eq("content_id", contentId)
    .maybeSingle();
  if (!item) return null;
  const { data: workout } = await db
    .from("workouts")
    .select("id, cloudflare_uid, durationInSeconds")
    .eq("id", contentId)
    .maybeSingle();
  return workout?.cloudflare_uid ? workout : null;
}

async function thumbnailBase(uid: string): Promise<string> {
  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  const video = await getVideoDetails(uid);
  const pathId = video.requireSignedURLs
    ? await signStreamToken(uid, { ttlSeconds: 600 })
    : uid;
  return `https://customer-${customerCode}.cloudflarestream.com/${pathId}/thumbnails/thumbnail.jpg`;
}

/**
 * GET ?contentId=...  →  { previewBase, durationSeconds }
 * The client appends ?time=Ns&height=... to previewBase for live previews.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const contentId = request.nextUrl.searchParams.get("contentId") ?? "";
    const workout = contentId ? await lessonVideo(auth.ctx.program.id, contentId) : null;
    if (!workout) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({
      previewBase: await thumbnailBase(workout.cloudflare_uid),
      durationSeconds: workout.durationInSeconds ?? 0,
    });
  } catch (error) {
    console.error("Frame preview error:", error);
    return NextResponse.json(
      { error: "Could not load the video preview. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST { contentId, timeSeconds }  →  { url }
 * Captures the frame at timeSeconds and sets it as the lesson thumbnail.
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

    const data = await request.json().catch(() => null);
    const contentId = typeof data?.contentId === "string" ? data.contentId : "";
    const timeSeconds = Number(data?.timeSeconds);
    if (!contentId || !Number.isFinite(timeSeconds) || timeSeconds < 0) {
      return NextResponse.json(
        { error: "contentId and timeSeconds required" },
        { status: 400 }
      );
    }

    const workout = await lessonVideo(auth.ctx.program.id, contentId);
    if (!workout) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const maxTime = Math.max(0, (workout.durationInSeconds ?? 0) - 1);
    const time = Math.round(Math.min(timeSeconds, maxTime));
    const base = await thumbnailBase(workout.cloudflare_uid);
    const frame = await fetch(`${base}?time=${time}s&height=1080`);
    if (!frame.ok) {
      return NextResponse.json(
        { error: "Could not capture that frame. Please try another moment." },
        { status: 502 }
      );
    }

    const { imageUrl } = await uploadImage(
      Buffer.from(await frame.arrayBuffer()),
      `lesson-frame-${workout.cloudflare_uid}-${time}s.jpg`,
      { instructorId: auth.ctx.instructorId, type: "gallery_item" }
    );

    const db = getServiceRoleClient();
    const { error } = await db
      .from("workouts")
      .update({ thumbnailUrl: imageUrl })
      .eq("id", contentId);
    if (error) {
      console.error("Frame thumbnail update failed:", error);
      return NextResponse.json(
        { error: "Failed to save the image. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Frame thumbnail error:", error);
    return NextResponse.json(
      { error: "Failed to set the image. Please try again." },
      { status: 500 }
    );
  }
}
