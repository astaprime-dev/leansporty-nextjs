import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe, stripeAutomaticTax } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/checkout/session  { productSlug }
 *
 * Creates a Stripe hosted Checkout session for a one-time product. The user must
 * be authenticated FIRST so `client_reference_id = user.id` is on the session —
 * the webhook (the only entitlement writer) uses it to grant access.
 *
 *  401 → not signed in (client should sign in, preserving intent, then retry)
 *  404 → product missing/inactive
 *  200 → { url } (client does window.location = url) OR { alreadyOwned: true }
 */
export async function POST(req: NextRequest) {
  let productSlug: string | undefined;
  try {
    ({ productSlug } = await req.json());
  } catch {
    /* ignore */
  }
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, stripe_price_id, kind, is_active")
    .eq("slug", productSlug)
    .single();
  if (!product || !product.is_active) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!product.stripe_price_id) {
    console.error(`Product ${productSlug} has no stripe_price_id`);
    return NextResponse.json({ error: "product not purchasable" }, { status: 409 });
  }

  // Already owned? (RLS limits this read to the caller's own rows.) Short-circuit
  // so we never create a duplicate Checkout session for content they hold.
  const { data: owned } = await supabase
    .from("entitlements")
    .select("id")
    .eq("product_id", product.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();
  if (owned) {
    return NextResponse.json({ alreadyOwned: true });
  }

  const origin = req.headers.get("origin") ?? "https://leansporty.com";
  const session = await getStripe().checkout.sessions.create({
    mode: product.kind === "membership" ? "subscription" : "payment",
    line_items: [{ price: product.stripe_price_id, quantity: 1 }],
    client_reference_id: user.id, // entitlement owner
    customer_email: user.email ?? undefined,
    metadata: { product_id: product.id }, // which product
    success_url: `${origin}/my-program?purchased=1&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/challenge?canceled=1`,
    ...(stripeAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
  });

  return NextResponse.json({ url: session.url });
}
