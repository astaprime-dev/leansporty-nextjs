/**
 * Static VAT determination for the payout webhook — a deliberate substitute for
 * Stripe Tax (~0.5%/transaction) at our scale. Place-of-supply for B2C digital
 * services:
 *
 *  - EU consumer → VAT due. Until OSS registration we charge the HOME rate on
 *    every EU sale (legal under the €10k/yr cross-border threshold — and without
 *    OSS there is nowhere to remit a foreign rate). After registering for OSS
 *    (free, via the PL tax portal), set VAT_DESTINATION_RATES=true to switch to
 *    per-country rates.
 *  - Non-EU consumer → outside the scope of EU VAT → 0. (Caveat: UK, Norway and
 *    Switzerland tax foreign digital sellers from very low/no thresholds —
 *    revisit before actively marketing there.)
 *  - Unknown country → conservative: treat as home-rate EU.
 *
 * Evidence: below €100k/yr cross-border, EU rules require only ONE piece of
 * customer-location evidence — the billing country Stripe Checkout collects
 * (billing_address_collection: "required" on the session).
 *
 * Standard rates as of mid-2026 — review once a year (they change rarely).
 */
export const HOME_VAT_PCT = Number(process.env.PAYOUT_VAT_PCT ?? 23);

const EU_STANDARD_VAT_PCT: Record<string, number> = {
  AT: 20, BE: 21, BG: 20, HR: 25, CY: 19, CZ: 21, DK: 25, EE: 24,
  FI: 25.5, FR: 20, DE: 19, GR: 24, EL: 24, HU: 27, IE: 23, IT: 22,
  LV: 21, LT: 21, LU: 17, MT: 18, MC: 20 /* Monaco = France for VAT */,
  NL: 21, PL: 23, PT: 23, RO: 21, SK: 23, SI: 22, ES: 21, SE: 25,
};

const useDestinationRates = process.env.VAT_DESTINATION_RATES === "true";

export function vatRateForCountry(country: string | null | undefined): number {
  const code = country?.trim().toUpperCase();
  if (!code) return HOME_VAT_PCT; // unknown buyer location → assume home-rate EU
  const euRate = EU_STANDARD_VAT_PCT[code];
  if (euRate === undefined) return 0; // non-EU → outside EU VAT scope
  return useDestinationRates ? euRate : HOME_VAT_PCT;
}
