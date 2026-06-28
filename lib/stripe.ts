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
 * Whether to enable Stripe Tax (automatic_tax) on Checkout. Left off by default;
 * the VAT mechanism (OD-1: Stripe Tax vs merchant-of-record) is settled before
 * the first live sale. Flip with STRIPE_AUTOMATIC_TAX=true once decided.
 */
export const stripeAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";
