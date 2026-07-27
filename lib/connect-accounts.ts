import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stripe Connect account state, mirrored into instructor_connect_accounts.
 *
 * The row is synced from two directions with the same mapping: the Connect
 * webhook (account.updated) and the status route (called when the instructor
 * returns from hosted onboarding, so the UI is right even if the webhook is
 * slow). Transfers are gated on transfers_status = 'active' AND payouts_enabled.
 */

export type ConnectAccountRow = {
  instructor_id: string;
  stripe_account_id: string;
  country: string;
  details_submitted: boolean;
  payouts_enabled: boolean;
  transfers_status: "inactive" | "pending" | "active";
  disabled_reason: string | null;
  requirements_due: number;
  onboarding_completed_at: string | null;
};

export type ConnectState =
  | "not_started"
  | "in_progress"
  | "under_review"
  | "restricted"
  | "active";

/** UI state derived from the synced row (no row → not_started). */
export function deriveConnectState(
  row: Pick<
    ConnectAccountRow,
    | "details_submitted"
    | "payouts_enabled"
    | "transfers_status"
    | "disabled_reason"
    | "requirements_due"
  > | null
): ConnectState {
  if (!row) return "not_started";
  if (row.transfers_status === "active" && row.payouts_enabled) return "active";
  if (!row.details_submitted) return "in_progress";
  // Submitted but not active: Stripe is either reviewing or needs more info.
  if (row.disabled_reason || row.requirements_due > 0) return "restricted";
  return "under_review";
}

/**
 * Import the instructor's name/address from their Stripe account into
 * instructor_billing (needed for the payout paperwork) — fills only columns
 * that are still empty, never overwrites anything the instructor typed.
 * Stripe collects this during hosted onboarding, so the app never asks twice.
 * (Tax numbers are NOT available from Stripe.)
 */
export async function backfillBillingFromAccount(
  db: SupabaseClient,
  instructorId: string,
  account: Stripe.Account
): Promise<void> {
  if (!account.details_submitted) return;
  const person = account.individual;
  if (!person || typeof person === "string") return;
  const { data: row } = await db
    .from("instructor_billing")
    .select("legal_name, address_line, city, postal_code")
    .eq("instructor_id", instructorId)
    .maybeSingle();
  if (!row) return;
  const patch: Record<string, string> = {};
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
  if (!row.legal_name && name) patch.legal_name = name;
  const addr = person.address;
  if (!row.address_line && addr?.line1) {
    patch.address_line = [addr.line1, addr.line2].filter(Boolean).join(", ");
  }
  if (!row.city && addr?.city) patch.city = addr.city;
  if (!row.postal_code && addr?.postal_code) patch.postal_code = addr.postal_code;
  if (Object.keys(patch).length === 0) return;
  const { error } = await db
    .from("instructor_billing")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("instructor_id", instructorId);
  if (error) console.error("billing backfill from Stripe failed:", error);
}

/**
 * Map a Stripe Account object onto the instructor_connect_accounts row keyed
 * by stripe_account_id. No-op (returns false) when the account isn't ours —
 * the Stripe account is shared with another app, same hygiene as the payment
 * webhook.
 */
export async function syncConnectAccountRow(
  db: SupabaseClient,
  account: Stripe.Account
): Promise<boolean> {
  const { data: existing } = await db
    .from("instructor_connect_accounts")
    .select("instructor_id, onboarding_completed_at")
    .eq("stripe_account_id", account.id)
    .maybeSingle();
  if (!existing) return false;

  const transfersStatus =
    account.capabilities?.transfers === "active"
      ? "active"
      : account.capabilities?.transfers === "pending"
        ? "pending"
        : "inactive";
  const active = transfersStatus === "active" && account.payouts_enabled === true;

  const { error } = await db
    .from("instructor_connect_accounts")
    .update({
      details_submitted: account.details_submitted ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      transfers_status: transfersStatus,
      disabled_reason: account.requirements?.disabled_reason ?? null,
      requirements_due: account.requirements?.currently_due?.length ?? 0,
      onboarding_completed_at:
        existing.onboarding_completed_at ??
        (active ? new Date().toISOString() : null),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);
  if (error) {
    console.error(
      `instructor_connect_accounts sync failed for ${account.id}:`,
      error
    );
    throw new Error(error.message);
  }

  // Completing Stripe onboarding IS choosing Stripe: record the payout-method
  // choice on the first transition to active. (Merely opening the Stripe card
  // or abandoning onboarding never changes the method.)
  if (active && !existing.onboarding_completed_at) {
    const { error: methodErr } = await db
      .from("instructor_billing")
      .update({ payout_method: "stripe", updated_at: new Date().toISOString() })
      .eq("instructor_id", existing.instructor_id);
    if (methodErr) {
      console.error("payout_method set on Stripe activation failed:", methodErr);
    }
  }
  return true;
}
