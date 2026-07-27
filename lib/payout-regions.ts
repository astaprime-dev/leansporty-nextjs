import { isEUCountry } from "@/lib/countries";

/**
 * Which payout rail an instructor's country puts them on.
 *
 * Stripe Connect (the automated rail) can only receive transfers from a Polish
 * platform if the connected account is in the EEA, UK, Switzerland, US, or
 * Canada (docs.stripe.com/connect/cross-border-payouts — cross-border transfers
 * are supported between these regions only; EEA↔EEA and UK↔EEA are free, the
 * rest cost 0.25%). Everywhere else (e.g. Ukraine, Brazil) uses the manual
 * rail: bank details collected in instructor_billing, sent by the founder via
 * Wise/Payoneer and marked paid in the admin payout run.
 */
const NON_EU_CONNECT_CODES = new Set([
  "IS", // Iceland   — EEA
  "LI", // Liechtenstein — EEA
  "NO", // Norway    — EEA
  "GB", // United Kingdom
  "CH", // Switzerland
  "US", // United States
  "CA", // Canada
]);

export function isConnectSupportedCountry(
  code: string | null | undefined
): boolean {
  if (!code) return false;
  const c = code.trim().toUpperCase();
  return isEUCountry(c) || NON_EU_CONNECT_CODES.has(c);
}
