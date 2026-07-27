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
  return true;
}
