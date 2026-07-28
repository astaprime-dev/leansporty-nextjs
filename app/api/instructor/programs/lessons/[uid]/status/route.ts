import { NextRequest, NextResponse } from "next/server";
import { getInstructorContext } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { getVideoDetails, getStreamPlaybackURL, signStreamToken } from "@/lib/cloudflare-stream";
import { uploadImage } from "@/lib/cloudflare-images";

export const runtime = "nodejs";

/**
 * GET /api/instructor/programs/lessons/[uid]/status
 *
 * Polled by the manage page after a tus upload finishes. Checks Cloudflare's
 * processing state and, the first time the video is ready, PROMOTES it:
 * inserts the workouts row (camelCase, iOS-shared schema — same column set as
 * the migrate cron) + the product_items row, and stamps program_uploads.
 * Idempotent: promotion only runs while workout_id is null; the unique
 * cloudflare_uid means concurrent polls can't double-promote (the second
 * insert attempt is skipped once workout_id is set).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const auth = await getInstructorContext();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getServiceRoleClient();
    const { data: upload } = await db
      .from("program_uploads")
      .select("id, instructor_id, product_id, title, status, workout_id")
      .eq("cloudflare_uid", uid)
      .maybeSingle();
    if (!upload || upload.instructor_id !== auth.instructorId) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.status === "ready") {
      return NextResponse.json({ status: "ready", workoutId: upload.workout_id });
    }
    if (upload.status === "error") {
      return NextResponse.json({ status: "error" });
    }

    let video;
    try {
      video = await getVideoDetails(uid);
    } catch {
      // Cloudflare may 404 briefly right after the tus upload completes.
      return NextResponse.json({ status: "processing", pctComplete: 0 });
    }

    if (video.status.state === "error") {
      await db
        .from("program_uploads")
        .update({
          status: "error",
          error_message: video.status.errorReasonText ?? video.status.errorReasonCode ?? null,
        })
        .eq("id", upload.id);
      return NextResponse.json({ status: "error" });
    }

    if (!video.readyToStream) {
      await db
        .from("program_uploads")
        .update({ status: "processing" })
        .eq("id", upload.id)
        .eq("status", "uploading");
      return NextResponse.json({
        status: "processing",
        pctComplete: video.status.pctComplete ?? null,
      });
    }

    // Ready → promote once.
    if (!upload.workout_id) {
      const durationSeconds = Math.round(video.duration ?? 0);
      const hls = getStreamPlaybackURL(uid).hls;
      const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
      // Default thumbnail: a real mid-workout frame (2:00 in, or the midpoint
      // of shorter videos) copied to Cloudflare Images. Frame 0 is often a
      // blank fade-in, and the Stream auto-thumbnail 404s behind
      // requireSignedURLs; a stored copy sidesteps both. The instructor can
      // replace it from the lesson row afterwards.
      let thumbnailUrl = `https://customer-${customerCode}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;
      try {
        const frameAt = Math.min(120, Math.max(1, Math.round(durationSeconds / 2)));
        const token = await signStreamToken(uid, { ttlSeconds: 300 });
        const frame = await fetch(
          `https://customer-${customerCode}.cloudflarestream.com/${token}/thumbnails/thumbnail.jpg?time=${frameAt}s&height=1080`
        );
        if (frame.ok) {
          const image = await uploadImage(
            Buffer.from(await frame.arrayBuffer()),
            `lesson-${uid}.jpg`,
            { instructorId: upload.instructor_id }
          );
          thumbnailUrl = image.imageUrl;
        }
      } catch {
        // Keep the Stream auto-thumbnail; grids fall back to the gradient.
      }

      // Same camelCase column set as the migrate cron (iOS-shared schema).
      const { data: workout, error: insErr } = await db
        .from("workouts")
        .insert({
          title: upload.title,
          description: "",
          durationInSeconds: durationSeconds,
          thumbnailUrl,
          videoUrl: hls,
          cloudflare_uid: uid,
          featured: false,
          visibility: "program",
          instructor_id: upload.instructor_id,
        })
        .select("id")
        .single();
      if (insErr || !workout) {
        console.error("Lesson promotion insert failed:", insErr);
        return NextResponse.json({ status: "processing", pctComplete: 100 });
      }

      const { data: last } = await db
        .from("product_items")
        .select("position")
        .eq("product_id", upload.product_id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error: itemErr } = await db.from("product_items").insert({
        product_id: upload.product_id,
        content_id: workout.id,
        position: (last?.position ?? 0) + 1,
        is_preview: false,
        item_label: null,
      });
      if (itemErr) {
        // Orphan guard: undo the workout row so a retry starts clean.
        console.error("Lesson product_items insert failed:", itemErr);
        await db.from("workouts").delete().eq("id", workout.id);
        return NextResponse.json({ status: "processing", pctComplete: 100 });
      }

      await db
        .from("program_uploads")
        .update({
          status: "ready",
          duration_seconds: durationSeconds,
          workout_id: workout.id,
        })
        .eq("id", upload.id)
        .is("workout_id", null);

      return NextResponse.json({ status: "ready", workoutId: workout.id });
    }

    return NextResponse.json({ status: "ready", workoutId: upload.workout_id });
  } catch (error) {
    console.error("Upload status error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
