"use client";

import { track } from "@vercel/analytics";

/**
 * Funnel events (Vercel Web Analytics custom events — visible on the Pro
 * plan; pageviews work on every plan). Thin wrapper so call sites never
 * throw if the provider is unavailable and event names stay in one place.
 *
 * The buyer funnel:
 *   pageview → watch_view (owned:no = trying the preview)
 *   → checkout_start → checkout_redirect → purchase_confirmed
 * Purchases themselves are also ground-truthed in the DB (entitlements /
 * instructor_payouts) — analytics is for the drop-off BETWEEN steps.
 */
export function trackEvent(
  name:
    | "watch_view"
    | "checkout_start"
    | "checkout_redirect"
    | "purchase_confirmed",
  props?: Record<string, string | number | boolean>
) {
  try {
    track(name, props);
  } catch {
    /* analytics must never break the product */
  }
}
