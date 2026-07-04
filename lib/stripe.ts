import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Stripe client. Never import this into client components — it reads
 * STRIPE_SECRET_KEY. Both the checkout and webhook routes run on the Node runtime.
 */
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Service-role Supabase client for the Stripe webhook ONLY. It has no user
 * session and must write `entitlements` across users, so it bypasses RLS.
 * Reuses the inline pattern from lib/instructor-roles.ts. Never use in
 * client-reachable code.
 */
export function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Ensure a Stripe Product with a deterministic id (= our products.slug) exists in
 * the CURRENT mode/account and carries the current display name. Deterministic ids
 * keep the Stripe catalog bounded by our own catalog size — one Product per
 * sellable item per mode, regardless of sales volume — while Checkout's inline
 * price_data supplies the price, so no Stripe ids are ever stored in the DB and
 * test/live mode each mint their own copy on first sale.
 */
// Per-instance memo (slug → last-synced name) so repeat checkouts skip the
// sync round-trip; a re-title changes the name and busts the entry naturally.
const ensuredProducts = new Map<string, string>();

export async function ensureStripeProduct(slug: string, name: string): Promise<string> {
  if (ensuredProducts.get(slug) === name) return slug;
  const stripe = getStripe();
  try {
    // Upsert-by-update: keeps the buyer-visible name in sync with re-titles, and
    // active:true un-archives a product someone tidied away in the dashboard
    // (Checkout rejects inactive products).
    await stripe.products.update(slug, { name, active: true });
  } catch (err) {
    if ((err as { code?: string })?.code !== "resource_missing") throw err;
    try {
      await stripe.products.create({ id: slug, name });
    } catch (createErr) {
      // A concurrent checkout won the create race — the product exists now.
      if ((createErr as { code?: string })?.code !== "resource_already_exists") {
        throw createErr;
      }
    }
  }
  ensuredProducts.set(slug, name);
  return slug;
}

/**
 * Whether to enable Stripe Tax (automatic_tax) on Checkout. Left off by default;
 * the VAT mechanism (OD-1: Stripe Tax vs merchant-of-record) is settled before
 * the first live sale. Flip with STRIPE_AUTOMATIC_TAX=true once decided.
 */
export const stripeAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
