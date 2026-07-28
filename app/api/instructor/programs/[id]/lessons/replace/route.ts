import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  signStreamToken,
  getSignedPlaybackURLs,
  getStreamPlaybackURL,
} from "@/lib/cloudflare-stream";
import { discardReplacedVideo } from "@/lib/programs";

// RS256 signing requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

/**
 * The replacement lifecycle for a lesson's video, after the new file has
 * uploaded (see lessons/upload-url and lessons/link with replacesWorkoutId).
 *
 * GET  ?contentId=…                     → a private preview of the new video
 * POST { contentId, action }            → apply | revert | discard
 *
 * The point of all of this is that the instructor never has to trust us with
 * the only copy: the lesson plays its current video until "apply", and the
 * video that was replaced stays on Cloudflare until "discard".
 */

type ReplacementRow = {
  id: string;
  cloudflare_uid: string;
  status: string;
  duration_seconds: number | null;
  replaced_uid: string | null;
  replaced_duration_seconds: number | null;
};

/** Program ownership + the lesson really belongs to it + its replacement row. */
async function loadReplacement(programId: string, contentId: string) {
  const auth = await getOwnedProgram(programId);
  if (!auth.ok) {
    return { ok: false as const, status: auth.status, error: auth.error };
  }
  const { program, instructorId } = auth.ctx;

  const db = getServiceRoleClient();
  const { data: item } = await db
    .from("product_items")
    .select("content_id")
    .eq("product_id", program.id)
    .eq("content_id", contentId)
    .maybeSingle();
  if (!item) {
    return { ok: false as const, status: 404 as const, error: "Lesson not found." };
  }

  const { data: row } = await db
    .from("program_uploads")
    .select(
      "id, cloudflare_uid, status, duration_seconds, replaced_uid, replaced_duration_seconds, instructor_id"
    )
    .eq("replaces_workout_id", contentId)
    .in("status", ["uploading", "processing", "ready", "error", "applied"])
    .maybeSingle();
  if (!row || row.instructor_id !== instructorId) {
    return {
      ok: false as const,
      status: 404 as const,
      error: "No new video for this lesson.",
    };
  }

  return { ok: true as const, db, row: row as ReplacementRow };
}

/**
 * GET → a signed, short-lived playback URL for the video WAITING to be
 * applied. It has no workouts row yet, so get_playable_uid (which every
 * student-facing player goes through) can't authorize it — this route is the
 * owner-only equivalent, and it never leaks the uid to the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentId = request.nextUrl.searchParams.get("contentId") ?? "";
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    const found = await loadReplacement(id, contentId);
    if (!found.ok) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }
    const { row } = found;
    if (row.status !== "ready") {
      return NextResponse.json(
        { error: "The new video isn't ready to watch yet." },
        { status: 409 }
      );
    }

    const haveSigningKey =
      !!process.env.CLOUDFLARE_STREAM_KEY_ID &&
      !!process.env.CLOUDFLARE_STREAM_KEY_PEM;

    if (!haveSigningKey) {
      if (process.env.ALLOW_UNSIGNED_PLAYBACK === "true") {
        return NextResponse.json({
          iframe: getStreamPlaybackURL(row.cloudflare_uid).iframe,
          durationSeconds: row.duration_seconds,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });
      }
      return NextResponse.json(
        { error: "Preview is not available right now." },
        { status: 500 }
      );
    }

    const token = await signStreamToken(row.cloudflare_uid, { ttlSeconds: 3600 });
    return NextResponse.json({
      iframe: getSignedPlaybackURLs(token).iframe,
      durationSeconds: row.duration_seconds,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
  } catch (error) {
    console.error("Replacement preview error:", error);
    return NextResponse.json(
      { error: "Preview is not available right now." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json().catch(() => null);
    const contentId = typeof data?.contentId === "string" ? data.contentId : "";
    const action = typeof data?.action === "string" ? data.action : "";
    if (!contentId || !["apply", "revert", "discard"].includes(action)) {
      return NextResponse.json(
        { error: "contentId and a valid action are required" },
        { status: 400 }
      );
    }

    const found = await loadReplacement(id, contentId);
    if (!found.ok) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }
    const { db, row } = found;

    /* ---------------------------------------------------------------- */
    /* apply — the lesson starts playing the new video                   */
    /* ---------------------------------------------------------------- */
    if (action === "apply") {
      if (row.status !== "ready") {
        return NextResponse.json(
          { error: "The new video isn't ready yet." },
          { status: 409 }
        );
      }

      const { data: workout } = await db
        .from("workouts")
        .select("id, cloudflare_uid, durationInSeconds")
        .eq("id", contentId)
        .maybeSingle();
      if (!workout?.cloudflare_uid) {
        return NextResponse.json(
          { error: "This lesson has no video to replace." },
          { status: 409 }
        );
      }

      // Record which video we're replacing BEFORE swapping. If the swap fails
      // and the instructor retries, this must still name the original — never
      // the replacement. The status guard makes a double-apply a no-op.
      const { data: stamped } = await db
        .from("program_uploads")
        .update({
          status: "applied",
          replaced_uid: workout.cloudflare_uid,
          replaced_duration_seconds: workout.durationInSeconds,
          workout_id: contentId,
        })
        .eq("id", row.id)
        .eq("status", "ready")
        .select("id")
        .maybeSingle();
      if (!stamped) {
        return NextResponse.json(
          { error: "That video was already applied." },
          { status: 409 }
        );
      }

      const { error: swapErr } = await db
        .from("workouts")
        .update({
          cloudflare_uid: row.cloudflare_uid,
          videoUrl: getStreamPlaybackURL(row.cloudflare_uid).hls,
          durationInSeconds: row.duration_seconds ?? workout.durationInSeconds,
        })
        .eq("id", contentId);
      if (swapErr) {
        console.error("Lesson video swap failed:", swapErr);
        await db
          .from("program_uploads")
          .update({
            status: "ready",
            replaced_uid: null,
            replaced_duration_seconds: null,
            workout_id: null,
          })
          .eq("id", row.id);
        return NextResponse.json(
          { error: "Could not switch to the new video. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, status: "applied" });
    }

    /* ---------------------------------------------------------------- */
    /* revert — put the old video back, keep the new one staged          */
    /* ---------------------------------------------------------------- */
    if (action === "revert") {
      if (row.status !== "applied" || !row.replaced_uid) {
        return NextResponse.json(
          { error: "There's no old video to go back to." },
          { status: 409 }
        );
      }

      const { error: swapErr } = await db
        .from("workouts")
        .update({
          cloudflare_uid: row.replaced_uid,
          videoUrl: getStreamPlaybackURL(row.replaced_uid).hls,
          durationInSeconds: row.replaced_duration_seconds,
        })
        .eq("id", contentId);
      if (swapErr) {
        console.error("Lesson video revert failed:", swapErr);
        return NextResponse.json(
          { error: "Could not go back to the old video. Please try again." },
          { status: 500 }
        );
      }

      // Back to "ready": the new video is still there to apply again, or to
      // cancel via the upload DELETE route.
      await db
        .from("program_uploads")
        .update({
          status: "ready",
          replaced_uid: null,
          replaced_duration_seconds: null,
          workout_id: null,
        })
        .eq("id", row.id);

      return NextResponse.json({ success: true, status: "ready" });
    }

    /* ---------------------------------------------------------------- */
    /* discard — let go of the old video for good                        */
    /* ---------------------------------------------------------------- */
    if (row.status !== "applied") {
      return NextResponse.json(
        { error: "There's no old video to delete." },
        { status: 409 }
      );
    }
    await discardReplacedVideo(row);
    return NextResponse.json({ success: true, status: "done" });
  } catch (error) {
    console.error("Replace action error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
