import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { deleteVideo } from "@/lib/cloudflare-stream";

export const runtime = "nodejs";

/**
 * Reclaim Cloudflare storage for recordings that expired WITHOUT being promoted to
 * the library. Runs AFTER the migrate cron each day.
 *
 * DEF-1 fix: only un-promoted recordings (migrated_to_workout_id IS NULL) are
 * deleted — once a recording has been promoted to a `workouts` row it IS the
 * library video and must be retained. Uses the service-role client (no user
 * session) so it works under the owner-scoped live_stream_sessions RLS.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceRoleClient();

  const { data: expiredStreams, error: fetchError } = await db
    .from("live_stream_sessions")
    .select("id, cloudflare_stream_id, recording_cloudflare_video_id, title")
    .eq("recording_available", true)
    .is("migrated_to_workout_id", null) // RETAIN promoted recordings (DEF-1)
    .not("recording_expires_at", "is", null)
    .lt("recording_expires_at", new Date().toISOString());

  if (fetchError) {
    console.error("Error fetching expired streams:", fetchError);
    return NextResponse.json({ error: "Failed to fetch expired streams" }, { status: 500 });
  }

  if (!expiredStreams || expiredStreams.length === 0) {
    return NextResponse.json({ success: true, message: "No expired recordings to clean up", cleaned: 0 });
  }

  const results = { cleaned: 0, failed: [] as string[] };

  for (const stream of expiredStreams) {
    try {
      // Prefer the recording UID if known; fall back to the live-input id (legacy).
      const target = stream.recording_cloudflare_video_id ?? stream.cloudflare_stream_id;
      if (target) {
        await deleteVideo(target);
      }

      const { error: updateError } = await db
        .from("live_stream_sessions")
        .update({ recording_available: false, recording_cloudflare_video_id: null })
        .eq("id", stream.id);

      if (updateError) {
        console.error(`Failed to update stream ${stream.id}:`, updateError);
        results.failed.push(stream.id);
      } else {
        results.cleaned++;
        console.log(`Cleaned up un-promoted recording for stream: ${stream.title} (${stream.id})`);
      }
    } catch (error) {
      console.error(`Error cleaning up stream ${stream.id}:`, error);
      results.failed.push(stream.id);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Cleaned up ${results.cleaned} expired (un-promoted) recordings`,
    cleaned: results.cleaned,
    failed: results.failed.length > 0 ? results.failed : undefined,
  });
}
