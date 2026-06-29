import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { getStreamRecordings, getStreamPlaybackURL } from "@/lib/cloudflare-stream";

export const runtime = "nodejs";

/**
 * Promote ended live streams into the on-demand `workouts` catalog (the "every
 * live class becomes library content for free" thesis). Runs BEFORE cleanup so a
 * recording is promoted before its 7-day TTL can reclaim it.
 *
 * DEF-1 fix: previously this (a) waited 2 months, (b) required recording_available
 * which cleanup had already flipped off, and (c) inserted columns that don't exist
 * on the real (camelCase, iOS-shared) workouts schema while storing the LIVE INPUT
 * id instead of the recording UID — so the library never filled. Now eligibility is
 * at stream end (the trigger), we fetch the actual recording UID from Cloudflare,
 * and insert the real schema. Uses the service-role client (no user session).
 *
 * Forward-only: historical/test streams are NOT auto-backfilled (would publish junk
 * to the iOS catalog) — that's a manual curation decision.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceRoleClient();
  const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;

  const { data: streams, error } = await db
    .from("live_stream_sessions")
    .select(
      "id, title, description, scheduled_duration_seconds, thumbnail_url, cloudflare_stream_id, recording_expires_at"
    )
    .eq("status", "ended")
    .is("migrated_to_workout_id", null)
    .not("migration_scheduled_at", "is", null)
    .lt("migration_scheduled_at", new Date().toISOString());

  if (error) {
    console.error("[migrate] fetch failed:", error);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
  if (!streams?.length) {
    return NextResponse.json({ success: true, migrated: 0, message: "nothing eligible" });
  }

  const results = { migrated: 0, pending: 0, gone: 0, failed: [] as string[] };

  for (const s of streams) {
    try {
      if (!s.cloudflare_stream_id) {
        results.gone++;
        continue;
      }

      // The recording UID isn't stored in the DB — fetch it from Cloudflare.
      const recordings = await getStreamRecordings(s.cloudflare_stream_id);
      const ready = recordings.find((r) => r.uid && r.readyToStream);

      if (!ready) {
        // Not ready yet → retry next run, unless the retention window has lapsed
        // (recording is gone) in which case stop trying.
        const expired =
          s.recording_expires_at && new Date(s.recording_expires_at) < new Date();
        if (expired) {
          results.gone++;
        } else {
          results.pending++;
        }
        continue;
      }

      const uid = ready.uid;
      const hls = getStreamPlaybackURL(uid).hls;
      const thumbnailUrl =
        s.thumbnail_url ||
        `https://customer-${customerCode}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;

      // Insert into the REAL workouts schema (camelCase, shared with iOS).
      const { data: workout, error: insErr } = await db
        .from("workouts")
        .insert({
          title: s.title,
          description: s.description || "",
          durationInSeconds: s.scheduled_duration_seconds ?? 0,
          thumbnailUrl,
          videoUrl: hls,
          cloudflare_uid: uid,
          featured: false,
        })
        .select("id")
        .single();

      if (insErr) {
        console.error(`[migrate] workout insert failed for stream ${s.id}:`, insErr);
        results.failed.push(s.id);
        continue;
      }

      // Link the stream + capture the recording UID so cleanup retains it.
      const { error: updErr } = await db
        .from("live_stream_sessions")
        .update({
          migrated_to_workout_id: workout.id,
          recording_available: true,
          recording_cloudflare_video_id: uid,
        })
        .eq("id", s.id);

      if (updErr) {
        console.error(`[migrate] link update failed for stream ${s.id}:`, updErr);
        results.failed.push(s.id);
        continue;
      }

      results.migrated++;
      console.log(`[migrate] promoted stream ${s.id} "${s.title}" → workout ${workout.id} (uid ${uid})`);
    } catch (e) {
      console.error(`[migrate] error for stream ${s.id}:`, e);
      results.failed.push(s.id);
    }
  }

  console.log("[migrate] done:", results);
  return NextResponse.json({ success: true, ...results });
}
