// Commerce / entitlements domain types (Phase 1).
// DB columns are snake_case except the legacy `workouts` table, whose video
// metadata columns are camelCase (see types/database.ts).

export type ProductKind = "course" | "challenge" | "membership" | "single";

export interface ChallengeConfig {
  program_length_days?: number;
  drip_enabled?: boolean;
  workout_count?: number;
}

export interface Product {
  id: string;
  slug: string;
  kind: ProductKind;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  price_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  config: ChallengeConfig;
  created_at: string;
}

/**
 * The subset of a `workouts` row safe to send to the client.
 * NEVER includes `cloudflare_uid` — the UID is only ever resolved server-side
 * by the playback-token route via get_playable_uid.
 */
export interface ChallengeWorkout {
  id: string;
  title: string | null;
  subtitle: string | null;
  durationInSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface ProductItem {
  product_id: string;
  content_id: string; // → workouts.id
  position: number;
  day_number: number | null;
  is_preview: boolean;
  item_label: string | null;
  workout: ChallengeWorkout | null;
}

export interface WorkoutProgress {
  workout_id: string;
  completed_at: string | null;
  last_position_seconds: number | null;
}

export type DayState =
  | "rest" // no workout mapped to this calendar day
  | "available" // entitled (or preview) and unlocked
  | "completed" // entitled + progress complete
  | "preview-free" // not entitled, free preview day
  | "locked" // not entitled, non-preview
  | "locked-until"; // entitled, drip on, not yet unlocked

export interface ProgramDay {
  dayNumber: number; // 1..N calendar day
  week: number; // 1-based
  weekday: number; // 1..7
  isRest: boolean;
  item: ProductItem | null;
  state: DayState;
  /** For drip 'locked-until': the day it unlocks. */
  unlocksOnDay?: number;
}
