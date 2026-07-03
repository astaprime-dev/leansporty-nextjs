import { getStripe, getServiceRoleClient } from "@/lib/stripe";

/**
 * Provision (or re-price) the `products` row + Stripe Product/Price backing a PAID
 * live class (Studio plan S2). Server-only and trusted: the caller MUST have already
 * verified that the acting user owns `instructorId`'s streams. Products are written
 * with the service-role client because `products` has no user INSERT policy.
 *
 * Stripe Prices are immutable, so re-pricing creates a NEW Price on the SAME Stripe
 * Product (reusing stored `stripe_product_id`) and repoints `products.stripe_price_id`.
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
    stripe_product_id: string | null;
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

  // Reuse the Stripe Product across re-prices; create one on first provision.
  let stripeProductId = existing?.stripe_product_id ?? null;
  if (!stripeProductId) {
    const sp = await stripe.products.create({ name: title });
    stripeProductId = sp.id;
  }

  const price = await stripe.prices.create({
    product: stripeProductId,
    currency,
    unit_amount: priceCents,
  });

  if (existing) {
    const { error } = await db
      .from("products")
      .update({
        title,
        price_cents: priceCents,
        currency,
        stripe_price_id: price.id,
        stripe_product_id: stripeProductId,
        is_active: true,
      })
      .eq("id", existing.id);
    if (error) throw new Error(`Failed to update product: ${error.message}`);
    return { productId: existing.id, slug: existing.slug };
  }

  // First provision: slug is derived from the stream id (unique, stable, internal).
  const slug = `class-${streamId}`;
  const { data, error } = await db
    .from("products")
    .insert({
      slug,
      kind: "single",
      title,
      price_cents: priceCents,
      currency,
      stripe_price_id: price.id,
      stripe_product_id: stripeProductId,
      instructor_id: instructorId,
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
