import { getServiceRoleClient } from "@/lib/stripe";
import { deleteVideo } from "@/lib/cloudflare-stream";

/**
 * V1 cost/abuse caps for instructor programs. Storage is billed to the
 * platform per stored minute, so every upload path must check these
 * SERVER-SIDE (the UI only mirrors them as friendly copy).
 */
export const PROGRAM_CAPS = {
  /** Draft + published programs per instructor. */
  maxProgramsPerInstructor: 3,
  /** Lessons (uploaded + reused) per program. */
  maxLessonsPerProgram: 30,
  /** Per-lesson length — also enforced BY Cloudflare via maxdurationseconds. */
  maxLessonSeconds: 45 * 60,
  /** Total stored direct-upload minutes per instructor across all programs. */
  maxStoredMinutesPerInstructor: 600,
} as const;

/**
 * Programs are multi-lesson products and priced accordingly: minimum €19
 * (founder decision 2026-07-27). Live class seats keep the €5 minimum
 * (PAID_PRICE_MIN_CENTS in lib/instructor-share.ts).
 */
export const PROGRAM_PRICE_MIN_CENTS = 1900;
export const PROGRAM_PRICE_MAX_CENTS = 50000;

/**
 * True once the program has any sale (entitlement or payout row). Gates
 * destructive edits: lesson removal and program deletion are blocked so
 * buyers never lose content they paid for.
 */
export async function programHasSales(productId: string): Promise<boolean> {
  const db = getServiceRoleClient();
  const [{ count: entitled }, { count: paid }] = await Promise.all([
    db
      .from("entitlements")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId),
    db
      .from("instructor_payouts")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId),
  ]);
  return (entitled ?? 0) > 0 || (paid ?? 0) > 0;
}

/**
 * Minutes of direct-upload video an instructor has stored (basis for the
 * storage cap). Uploads still in flight count at the max lesson length so a
 * burst of parallel uploads can't blow past the cap; failed uploads drop out.
 */
export async function storedUploadSeconds(instructorId: string): Promise<number> {
  const db = getServiceRoleClient();
  const { data } = await db
    .from("program_uploads")
    .select("status, duration_seconds")
    .eq("instructor_id", instructorId)
    .neq("status", "error");
  let total = 0;
  for (const row of data ?? []) {
    total += row.duration_seconds ?? PROGRAM_CAPS.maxLessonSeconds;
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* Replace video                                                       */
/* ------------------------------------------------------------------ */

/** Statuses that mean a replacement is still in play for a lesson. */
export const ACTIVE_REPLACEMENT_STATUSES = [
  "uploading",
  "processing",
  "ready",
  "applied",
] as const;

type ReplaceGuard = { ok: true } | { ok: false; status: 404 | 409; error: string };

/**
 * May this lesson's video be replaced right now?
 *
 * Authorization is by PROGRAM ownership plus lesson membership — deliberately
 * not workouts.instructor_id, which is null on the seeded Challenge lessons
 * (they predate the column and were never backfilled). The caller has already
 * proven it owns the program.
 */
export async function assertReplaceable(
  productId: string,
  workoutId: string
): Promise<ReplaceGuard> {
  const db = getServiceRoleClient();

  const { data: item } = await db
    .from("product_items")
    .select("content_id")
    .eq("product_id", productId)
    .eq("content_id", workoutId)
    .maybeSingle();
  if (!item) return { ok: false, status: 404, error: "Lesson not found." };

  // A lesson added from "Use a class recording" shares its workouts row with
  // the public catalog and the stream's own page. Swapping its video would
  // silently change the recording everywhere, and discarding would delete a
  // stream recording — so that path adds a new lesson instead.
  const { data: recording } = await db
    .from("live_stream_sessions")
    .select("id")
    .eq("migrated_to_workout_id", workoutId)
    .maybeSingle();
  if (recording) {
    return {
      ok: false,
      status: 409,
      error:
        "This lesson uses a recording of one of your classes, so its video can't be replaced here. Add the new video as a lesson instead.",
    };
  }

  const { data: existing } = await db
    .from("program_uploads")
    .select("id")
    .eq("replaces_workout_id", workoutId)
    .in("status", ACTIVE_REPLACEMENT_STATUSES as unknown as string[])
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      status: 409,
      error:
        "A new video for this lesson is already in progress. Finish or cancel it first.",
    };
  }

  return { ok: true };
}

/**
 * Let go of the video a replacement replaced: delete it from Cloudflare, drop
 * its own upload row (seeded Challenge lessons have none — nothing to drop),
 * and turn the replacement row into an ordinary promoted upload so nothing
 * downstream has to know a replacement ever happened.
 */
export async function discardReplacedVideo(row: {
  id: string;
  replaced_uid: string | null;
}): Promise<void> {
  const db = getServiceRoleClient();
  if (row.replaced_uid) {
    await deleteVideo(row.replaced_uid);
    await db.from("program_uploads").delete().eq("cloudflare_uid", row.replaced_uid);
  }
  await db
    .from("program_uploads")
    .update({
      status: "ready",
      replaces_workout_id: null,
      replaced_uid: null,
      replaced_duration_seconds: null,
    })
    .eq("id", row.id);
}
