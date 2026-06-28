import Link from "next/link";
import { Play, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getChallengeData } from "@/app/challenge/data";
import {
  buildProgramDays,
  completedWorkoutDays,
  formatPrice,
  mergeCanonicalItems,
  nextActionableDay,
  programLengthDays,
  totalWorkoutDays,
} from "@/lib/challenge";

/**
 * Compact "your program" summary card — surfaces the challenge (progress +
 * Continue for owners, or a start/unlock CTA for non-owners) on the post-login
 * surfaces (Activity, Workouts) so a buyer's program is never buried. Renders
 * null if the product isn't seeded.
 */
export async function ProgramCard({ className = "" }: { className?: string }) {
  const data = await getChallengeData();
  if (!data) return null;

  const { product, owned } = data;
  const days = buildProgramDays(
    programLengthDays(product.config),
    mergeCanonicalItems(data.items, product.id),
    { owned, completedContentIds: new Set(data.completedContentIds) }
  );
  const total = totalWorkoutDays(days);
  const done = completedWorkoutDays(days);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = nextActionableDay(days);
  const priceLabel = formatPrice(product.price_cents, product.currency);

  if (owned) {
    return (
      <div
        className={`rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 p-5 sm:p-6 ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Your program
            </p>
            <h2 className="font-display text-2xl font-light text-gray-900">
              {product.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {done} of {total} sessions complete
            </p>
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Button asChild variant="brand" className="flex-shrink-0 gap-2">
            <Link href="/my-program">
              <Play className="h-4 w-4" />
              {done === 0
                ? "Start Day 1"
                : done >= total
                  ? "Revisit your program"
                  : next
                    ? `Continue — Day ${next.dayNumber}`
                    : "Open my program"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not owned — encourage starting the challenge.
  return (
    <Link
      href="/challenge"
      className={`group flex items-center justify-between gap-4 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-500 to-rose-400 p-5 text-white shadow-sm transition-all hover:shadow-lg hover:shadow-pink-200/50 sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        <Sparkles className="h-7 w-7 flex-shrink-0" strokeWidth={1.5} />
        <div>
          <h2 className="font-display text-xl font-light">{product.title}</h2>
          <p className="text-sm text-white/90">
            {total} guided sessions + rest days — Day 1 is free to try.
          </p>
        </div>
      </div>
      <Badge
        variant="lock"
        className="hidden flex-shrink-0 gap-1 px-5 py-2 text-sm transition-transform group-hover:scale-105 sm:inline-flex"
      >
        <Lock className="h-3.5 w-3.5" /> {priceLabel}
      </Badge>
    </Link>
  );
}
