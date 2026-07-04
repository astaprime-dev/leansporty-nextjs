import { LiveStreamSession } from "@/types/streaming";

type StreamTiming = Pick<
  LiveStreamSession,
  "status" | "scheduled_start_time" | "scheduled_duration_seconds"
>;

/**
 * A scheduled class whose whole time window (start + duration) has elapsed
 * without the instructor ever going live. Such classes stay in the catalog
 * until cancelled, but must not be purchasable/enrollable — the live session
 * they sell will never happen.
 *
 * The cutoff is the END of the window, not the start, so an instructor who
 * starts a few minutes late doesn't lock out buyers.
 */
export function isMissedScheduledClass(
  stream: StreamTiming,
  now: Date = new Date()
): boolean {
  if (stream.status !== "scheduled") return false;
  const windowEnd =
    new Date(stream.scheduled_start_time).getTime() +
    (stream.scheduled_duration_seconds ?? 0) * 1000;
  return windowEnd < now.getTime();
}
