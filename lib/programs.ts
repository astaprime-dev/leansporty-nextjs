import { getServiceRoleClient } from "@/lib/stripe";
import { PAID_PRICE_MIN_CENTS } from "@/lib/instructor-share";

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

export const PROGRAM_PRICE_MIN_CENTS = PAID_PRICE_MIN_CENTS;
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
