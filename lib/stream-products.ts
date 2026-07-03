import { getStripe, getServiceRoleClient } from "@/lib/stripe";

type Db = ReturnType<typeof getServiceRoleClient>;
type StripeClient = ReturnType<typeof getStripe>;

/**
 * Get (or create once) the SHARED Stripe Price for a given amount. All paid classes
 * reuse these: a single "Lean Sporty live class" Stripe Product per currency holds a
 * pool of Prices keyed by amount, cached in `stripe_class_prices`. So the number of
 * Stripe objects equals the number of distinct amounts ever used — not the number of
 * classes. (The buyer sees the generic shared product name at Checkout by design.)
 */
async function getOrCreateClassPrice(
  db: Db,
  stripe: StripeClient,
  currency: string,
  unitAmount: number
): Promise<{ priceId: string; productId: string }> {
  const { data: cached } = await db
    .from("stripe_class_prices")
    .select("stripe_price_id, stripe_product_id")
    .eq("currency", currency)
    .eq("unit_amount", unitAmount)
    .maybeSingle();
  if (cached) {
    return { priceId: cached.stripe_price_id, productId: cached.stripe_product_id };
  }

  // Reuse the shared product for this currency if we've made one; else create it once.
  const { data: anyRow } = await db
    .from("stripe_class_prices")
    .select("stripe_product_id")
    .eq("currency", currency)
    .limit(1)
    .maybeSingle();
  let productId = anyRow?.stripe_product_id ?? null;
  if (!productId) {
    const sp = await stripe.products.create({
      name: `Lean Sporty live class (${currency.toUpperCase()})`,
    });
    productId = sp.id;
  }

  const price = await stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitAmount,
  });

  const { error } = await db.from("stripe_class_prices").insert({
    currency,
    unit_amount: unitAmount,
    stripe_price_id: price.id,
    stripe_product_id: productId,
  });
  if (error) {
    // A concurrent provision likely won the (currency, amount) PK race → use the
    // stored winner (our freshly-created Price is a harmless orphan).
    const { data: winner } = await db
      .from("stripe_class_prices")
      .select("stripe_price_id, stripe_product_id")
      .eq("currency", currency)
      .eq("unit_amount", unitAmount)
      .maybeSingle();
    if (winner) {
      return { priceId: winner.stripe_price_id, productId: winner.stripe_product_id };
    }
    throw new Error(`Failed to cache class price: ${error.message}`);
  }
  return { priceId: price.id, productId };
}

/**
 * Provision (or re-price) the per-class `products` row backing a PAID live class
 * (Studio plan S2). Server-only and trusted: the caller MUST have already verified
 * that the acting user owns `instructorId`'s streams. Products are written with the
 * service-role client because `products` has no user INSERT policy.
 *
 * The Stripe Price is SHARED across all classes at the same amount (see
 * getOrCreateClassPrice) — re-pricing just repoints this class's `stripe_price_id`
 * at the shared Price for the new amount. No per-class Stripe objects are created.
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

  const stripe = getStripe();
  const db = getServiceRoleClient();

  const { priceId, productId: sharedProductId } = await getOrCreateClassPrice(
    db,
    stripe,
    currency,
    priceCents
  );

  if (existing) {
    const { error } = await db
      .from("products")
      .update({
        title,
        price_cents: priceCents,
        currency,
        stripe_price_id: priceId,
        stripe_product_id: sharedProductId,
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
      stripe_price_id: priceId,
      stripe_product_id: sharedProductId,
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
 * The Stripe Product/Price are left in place (harmless); is_active=false makes the
 * Checkout route reject it. Best-effort — never throws into the caller's happy path.
 */
export async function deactivateStreamProduct(productId: string): Promise<void> {
  try {
    const db = getServiceRoleClient();
    await db.from("products").update({ is_active: false }).eq("id", productId);
  } catch (e) {
    console.error("deactivateStreamProduct failed:", e);
  }
}
