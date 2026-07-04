import { getServiceRoleClient } from "@/lib/stripe";

/**
 * Currencies we sell in. The ledger/payout math assumes single-currency EUR
 * (Adaptive Pricing is off); widen deliberately (plan E2.8), not by request input.
 * With inline price_data there is no Stripe-side validation at provision time, so
 * this allowlist is the only thing keeping junk currencies from reaching checkout.
 */
export const SUPPORTED_CURRENCIES = new Set(["eur"]);

/**
 * Provision (or re-price) the per-class `products` row backing a PAID live class
 * (Studio plan S2). Server-only and trusted: the caller MUST have already verified
 * that the acting user owns `instructorId`'s streams. Products are written with the
 * service-role client because `products` has no user INSERT policy.
 *
 * No Stripe objects are created here: Checkout defines the price inline via
 * `price_data` from this row's `price_cents`/`currency`, so the same row sells
 * correctly in test and live mode alike. Re-pricing is just a row update.
 *
 * Returns the product id + slug (the slug is what the buy flow passes to Checkout).
 */
export type StreamProductInput = {
  instructorId: string;
  streamId: string;
  title: string;
  priceCents: number;
  currency: string; // e.g. "eur"
  existing?: {
    id: string;
    slug: string;
  } | null;
};

export async function provisionStreamProduct(
  input: StreamProductInput
): Promise<{ productId: string; slug: string }> {
  const { instructorId, streamId, title, priceCents, currency, existing } = input;
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("priceCents must be a positive integer");
  }
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const db = getServiceRoleClient();

  if (existing) {
    const { error } = await db
      .from("products")
      .update({
        title,
        price_cents: priceCents,
        currency,
        is_active: true,
      })
      .eq("id", existing.id);
    if (error) throw new Error(`Failed to update product: ${error.message}`);
    return { productId: existing.id, slug: existing.slug };
  }

  // First provision: slug is derived from the stream id (unique, stable, internal).
  // Lock the instructor's split % onto the product (their per-instructor default,
  // else the platform default of 85) so later default changes don't rewrite history.
  const { data: instr } = await db
    .from("instructors")
    .select("split_pct")
    .eq("id", instructorId)
    .maybeSingle();
  const splitPct = instr?.split_pct ?? 85;

  const slug = `class-${streamId}`;
  const { data, error } = await db
    .from("products")
    .insert({
      slug,
      kind: "single",
      title,
      price_cents: priceCents,
      currency,
      instructor_id: instructorId,
      split_pct: splitPct,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create product: ${error?.message ?? "unknown"}`);
  }
  return { productId: data.id, slug };
}

/**
 * Mark a class's product inactive (e.g. the instructor set the price back to free).
 * is_active=false makes the Checkout route reject it. Best-effort — never throws
 * into the caller's happy path.
 */
export async function deactivateStreamProduct(productId: string): Promise<void> {
  try {
    const db = getServiceRoleClient();
    await db.from("products").update({ is_active: false }).eq("id", productId);
  } catch (e) {
    console.error("deactivateStreamProduct failed:", e);
  }
}
