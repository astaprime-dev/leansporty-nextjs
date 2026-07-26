import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ensureStripeProduct, getStripe, stripeAutomaticTax } from "@/lib/stripe";
import { SUPPORTED_CURRENCIES } from "@/lib/stream-products";
import { isMissedScheduledClass } from "@/lib/stream-time";

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
  let returnPath: string | undefined;
  try {
    ({ productSlug, returnPath } = await req.json());
  } catch {
    /* ignore */
  }
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  }
  // Only accept a same-site relative path (open-redirect guard). Used by paid live
  // classes to return the buyer to the class page instead of /my-program.
  const safeReturnPath =
    typeof returnPath === "string" && returnPath.startsWith("/") && !returnPath.startsWith("//")
      ? returnPath
      : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, title, kind, price_cents, currency, is_active, admin_disabled, config")
    .eq("slug", productSlug)
    .single();
  if (!product || !product.is_active || product.admin_disabled) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // 50 = Stripe's EUR per-charge minimum (also enforced at class save; this
  // backstops rows written by seeds/SQL so bad data 409s instead of throwing).
  if (
    !Number.isInteger(product.price_cents) ||
    product.price_cents < 50 ||
    !SUPPORTED_CURRENCIES.has(product.currency)
  ) {
    console.error(`Product ${productSlug} has no sellable price/currency`);
    return NextResponse.json({ error: "product not purchasable" }, { status: 409 });
  }

  // Paid live class that never happened: a scheduled session whose whole window
  // elapsed without going live stays in the catalog until cancelled, but selling
  // it would charge for a class that will never air. Non-class products have no
  // linked sessions, so this is a no-op for them.
  const { data: linkedStreams } = await supabase
    .from("live_stream_sessions")
    .select("status, scheduled_start_time, scheduled_duration_seconds")
    .eq("product_id", product.id);
  if (
    linkedStreams &&
    linkedStreams.length > 0 &&
    linkedStreams.every((s) => isMissedScheduledClass(s))
  ) {
    return NextResponse.json(
      { error: "This class's scheduled time has passed." },
      { status: 410 }
    );
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

  // Time-boxed access: if the product config sets access_months, compute the
  // entitlement expiry now and carry it in metadata; the webhook applies it.
  // Omit/0 → lifetime (expires_at stays null).
  const metadata: Record<string, string> = {
    product_id: product.id,
    product_slug: productSlug, // carried to the webhook for the recovery resume link
  };
  const accessMonths = (product.config as { access_months?: number } | null)
    ?.access_months;
  if (typeof accessMonths === "number" && accessMonths > 0) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + accessMonths);
    metadata.expires_at = expires.toISOString();
  }

  const origin = req.headers.get("origin") ?? "https://leansporty.com";

  // Short expiry so an abandoned session fires `checkout.session.expired` ~1h later,
  // which triggers the recovery sequence promptly (Stripe allows 30min–24h). A genuine
  // buyer completes in minutes; anyone past the window is recovered via email.
  // Subscriptions (Phase 2) don't support expires_at on Checkout, so payment-mode only.
  const isPayment = product.kind !== "membership";
  const RECOVERY_EXPIRY_MINUTES = 60;

  // The price is defined inline from the products row rather than referencing a
  // pre-created Stripe Price. Stored Price ids are mode-bound (test vs live) and
  // account-bound, which breaks whichever environment didn't mint them; inline
  // price_data works identically in every mode/account. The Stripe Product uses a
  // deterministic id (= our slug) so the Stripe catalog stays bounded by our own
  // catalog size instead of growing per sale. Payouts are unaffected — the webhook
  // reads session.amount_total. Memberships (Phase 2) get their billing interval
  // from config.billing_interval (default monthly).
  // Coerce (not just cast) the free-form jsonb value so a typo like "monthly"
  // degrades to the default instead of a Stripe 400 on every purchase.
  const billingInterval =
    (product.config as { billing_interval?: string } | null)?.billing_interval ===
    "year"
      ? "year"
      : "month";

  let session;
  try {
    const stripeProductId = await ensureStripeProduct(productSlug, product.title);
    session = await getStripe().checkout.sessions.create({
      mode: isPayment ? "payment" : "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.price_cents,
            product: stripeProductId,
            // Prices are gross (EU consumer norm); required if automatic_tax
            // is ever enabled, harmless while it's off.
            tax_behavior: "inclusive",
            ...(isPayment ? {} : { recurring: { interval: billingInterval } }),
          },
        },
      ],
      client_reference_id: user.id, // entitlement owner
      customer_email: user.email ?? undefined,
      // Buyer's billing country = our VAT place-of-supply evidence (one piece
      // suffices below €100k/yr cross-border). The webhook reads it to back the
      // right VAT rate out of the price (lib/vat-rates.ts).
      billing_address_collection: "required",
      // Promo codes (e.g. 100%-off friends/reviewer comps): entered on the
      // Stripe page itself. A zero total needs no card and incurs no fees;
      // the webhook grants the entitlement exactly like a paid session.
      allow_promotion_codes: true,
      // Required ToS checkbox — the EU withdrawal waiver lives in /terms §5,
      // so ticking it is the buyer's express consent (Stripe records it),
      // which is what makes the no-refunds policy hold up, not just the
      // custom_text disclosure below. Requires the Terms of Service URL to
      // be set in Stripe Dashboard → Settings → Business → Public details;
      // without it every session creation fails.
      consent_collection: { terms_of_service: "required" },
      metadata, // product_id, product_slug (+ expires_at for time-boxed grants)
      success_url: safeReturnPath
        ? `${origin}${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}purchased=1&sid={CHECKOUT_SESSION_ID}`
        : `${origin}/my-program?purchased=1&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: safeReturnPath
        ? `${origin}${safeReturnPath}${safeReturnPath.includes("?") ? "&" : "?"}canceled=1`
        : `${origin}/challenge?canceled=1`,
      ...(isPayment
        ? {
            expires_at:
              Math.floor(Date.now() / 1000) + RECOVERY_EXPIRY_MINUTES * 60,
            // One-time payments don't create a Customer by default ("guest
            // customers") — create one so support lookups by email work and
            // future membership subscriptions attach to the same record.
            customer_creation: "always" as const,
            // Numbered Stripe invoice per sale — the accountant's source of
            // truth. (Subscription-mode sessions invoice inherently.)
            invoice_creation: { enabled: true },
            // EU withdrawal-right waiver: digital access starts immediately;
            // stating it at the point of payment is what makes the
            // no-refunds policy stick for EU consumers.
            custom_text: {
              submit: {
                message:
                  "Digital access starts immediately after payment. By purchasing you agree to immediate delivery and acknowledge that the 14-day EU withdrawal right does not apply.",
              },
            },
          }
        : {}),
      ...(stripeAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
    });
  } catch (err) {
    // Controlled failure instead of an opaque 500: log with product context and
    // 409 on Stripe's "this can't be sold" rejections (bad amount/currency/etc).
    console.error(`Checkout session creation failed for ${productSlug}:`, err);
    const stripeType = (err as { type?: string })?.type;
    if (stripeType === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "product not purchasable" }, { status: 409 });
    }
    return NextResponse.json({ error: "checkout unavailable" }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
