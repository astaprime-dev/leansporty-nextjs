import { NextResponse } from "next/server";
import { getInstructorContext } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * GET /api/instructor/programs/recordings
 *
 * The "reuse a class recording" picker: workouts that are recordings of this
 * instructor's own past classes. Sources: workouts attributed via
 * instructor_id (new rows) UNION workouts reached through
 * live_stream_sessions.migrated_to_workout_id (rows migrated before
 * attribution existed). Never returns cloudflare_uid.
 */
export async function GET() {
  try {
    const auth = await getInstructorContext();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getServiceRoleClient();

    const [attributed, migrated] = await Promise.all([
      db
        .from("workouts")
        .select("id, title, durationInSeconds, thumbnailUrl, created_at")
        .eq("instructor_id", auth.instructorId)
        .eq("visibility", "public") // direct program uploads are not "recordings"
        .not("cloudflare_uid", "is", null),
      db
        .from("live_stream_sessions")
        .select(
          "migrated_to_workout_id, workout:migrated_to_workout_id(id, title, durationInSeconds, thumbnailUrl, created_at)"
        )
        .eq("instructor_id", auth.instructorId)
        .not("migrated_to_workout_id", "is", null),
    ]);

    type Recording = {
      id: string;
      title: string | null;
      durationInSeconds: number | null;
      thumbnailUrl: string | null;
      created_at: string;
    };

    const byId = new Map<string, Recording>();
    for (const w of (attributed.data ?? []) as Recording[]) {
      byId.set(w.id, w);
    }
    for (const row of migrated.data ?? []) {
      const w = (row as { workout: Recording | Recording[] | null }).workout;
      const workout = Array.isArray(w) ? w[0] : w;
      if (workout) byId.set(workout.id, workout);
    }

    const recordings = Array.from(byId.values()).sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? "")
    );

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Recordings list error:", error);
    return NextResponse.json({ error: "Failed to load recordings" }, { status: 500 });
  }
}
