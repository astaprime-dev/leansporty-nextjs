// Shared 21-Day Challenge program model (CHALLENGE_PRODUCTIZATION_SPEC §2/§6.2).
// Data-driven: the day→workout mapping lives in product_items.day_number, so this
// helper handles graceful degrade (N<15 ready assets) and drip with no code change.

import type {
  ChallengeConfig,
  DayState,
  ProductItem,
  ProgramDay,
} from "@/types/commerce";

export const CHALLENGE_SLUG = "21-day-dance-challenge";
export const DEFAULT_PROGRAM_LENGTH_DAYS = 21;
export const DEFAULT_PRICE_CENTS = 4900;
export const DEFAULT_WORKOUT_COUNT = 15;

/** Calendar days that carry a workout (CHALLENGE §2): 5/week, rest on 6,7. */
export const CANONICAL_WORKOUT_DAYS = [
  1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19,
] as const;

/**
 * Placeholder curriculum for the public landing before the product is seeded
 * (or when items aren't loaded). Day 1 is the free preview; the rest are locked.
 * Carries no real workout — used only to communicate program structure.
 */
export function synthesizeCurriculumItems(productId = ""): ProductItem[] {
  return CANONICAL_WORKOUT_DAYS.map((day, i) => ({
    product_id: productId,
    content_id: `placeholder-${day}`,
    position: i + 1,
    day_number: day,
    is_preview: day === 1,
    item_label: null,
    workout: null,
  }));
}

export function programLengthDays(config?: ChallengeConfig): number {
  return config?.program_length_days ?? DEFAULT_PROGRAM_LENGTH_DAYS;
}

export function isDripEnabled(config?: ChallengeConfig): boolean {
  return config?.drip_enabled === true;
}

interface BuildOpts {
  /** Caller holds a live entitlement to the product. */
  owned: boolean;
  /** content_ids the caller has completed. */
  completedContentIds: Set<string>;
  /** Drip schedule (off by default, D3). */
  dripEnabled?: boolean;
  /** Entitlement grant time, for drip unlock math. */
  grantedAt?: string | null;
  /** Override "now" for testing; defaults to Date.now(). */
  now?: number;
}

/**
 * Build the calendar of program days for rendering. Days with no mapped workout
 * render as rest days. State per day follows the §6.2 table.
 */
export function buildProgramDays(
  totalDays: number,
  items: ProductItem[],
  opts: BuildOpts
): ProgramDay[] {
  const byDay = new Map<number, ProductItem>();
  for (const it of items) {
    if (it.day_number != null) byDay.set(it.day_number, it);
  }

  const days: ProgramDay[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const item = byDay.get(d) ?? null;
    const { state, unlocksOnDay } = computeDayState(d, item, opts);
    days.push({
      dayNumber: d,
      week: Math.floor((d - 1) / 7) + 1,
      weekday: ((d - 1) % 7) + 1,
      isRest: !item,
      item,
      state,
      unlocksOnDay,
    });
  }
  return days;
}

function computeDayState(
  dayNumber: number,
  item: ProductItem | null,
  opts: BuildOpts
): { state: DayState; unlocksOnDay?: number } {
  if (!item) return { state: "rest" };

  const completed = opts.completedContentIds.has(item.content_id);

  if (opts.owned) {
    if (opts.dripEnabled && item.day_number != null) {
      const unlockAt = dripUnlockTime(opts.grantedAt, item.day_number);
      const now = opts.now ?? Date.now();
      if (unlockAt != null && now < unlockAt) {
        return { state: "locked-until", unlocksOnDay: item.day_number };
      }
    }
    return { state: completed ? "completed" : "available" };
  }

  // Not entitled: preview is open (auth-gated, not purchase-gated); rest is locked.
  return { state: item.is_preview ? "preview-free" : "locked" };
}

/** A day unlocks at grantedAt + (day_number - 1) days when drip is on. */
function dripUnlockTime(
  grantedAt: string | null | undefined,
  dayNumber: number
): number | null {
  if (!grantedAt) return null;
  const base = new Date(grantedAt).getTime();
  if (Number.isNaN(base)) return null;
  return base + (dayNumber - 1) * 24 * 60 * 60 * 1000;
}

/** Count of workout (non-rest) days that exist in the program. */
export function totalWorkoutDays(days: ProgramDay[]): number {
  return days.filter((d) => !d.isRest).length;
}

/** Count of completed workout days. */
export function completedWorkoutDays(days: ProgramDay[]): number {
  return days.filter((d) => d.state === "completed").length;
}

/** The first playable day for a "Start / Continue" CTA (UX-FR-3). */
export function nextActionableDay(days: ProgramDay[]): ProgramDay | null {
  return (
    days.find((d) => d.state === "available") ??
    days.find((d) => d.state === "preview-free") ??
    null
  );
}

export function formatPrice(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
