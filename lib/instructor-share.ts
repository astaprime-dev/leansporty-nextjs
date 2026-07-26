/**
 * Client-safe mirror of the payout webhook's net-of-VAT split
 * (app/api/stripe/webhook/route.ts) for "you receive ≈€X" previews shown while
 * an instructor sets a price. The price an instructor sets is the exact
 * VAT-inclusive amount the student pays; VAT comes off first, then the split.
 * There is no per-sale fee floor — the €5 minimum paid price is what keeps
 * small sales viable (below it, a class should be free). The webhook is the
 * source of truth — keep VAT_RATE in sync with its PAYOUT_VAT_PCT default.
 */
export const VAT_RATE = 0.23;

/**
 * Minimum price for any PAID class or program, in cents. Chosen so the 20%
 * platform share always clears the fixed per-sale costs (card fee, invoice,
 * delivery — ~€0.45) without needing a per-sale fee floor that would undercut
 * the advertised 80%: at €5 the fee is ~€0.81, ~2× costs. Matches OnlyFans's
 * $4.99 minimum. Enforced at class/program create, update, and publish.
 */
export const PAID_PRICE_MIN_CENTS = 500;

export function instructorShare(priceEuros: number, splitPct: number): number {
  if (!Number.isFinite(priceEuros) || priceEuros <= 0) return 0;
  const net = priceEuros / (1 + VAT_RATE);
  return net * (splitPct / 100);
}
