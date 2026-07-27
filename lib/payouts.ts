import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The monthly payout run over the instructor_payouts ledger (dual rail).
 *
 * Connect rail: one Stripe transfer PER pending ledger row, tied to the
 * original charge via source_transaction — so a run never depends on the
 * platform's available balance (Stripe queues fund movement until the charge
 * settles) and every refund can be reversed against exactly one transfer.
 * Idempotent and resumable: paid rows are excluded by selection, the transfer
 * idempotency key is stable per row, and a per-row failure records
 * transfer_error and moves on — re-running only touches what's still pending.
 *
 * Manual rail (countries Connect can't reach from a PL platform): the founder
 * sends the money via Wise/Payoneer and marks the instructor's pending rows
 * paid — same batch semantics, paid_via = 'manual'.
 */

/** €20 in cents — balances below this roll over to the next run. */
export const PAYOUT_MIN_CENTS = 2000;

type LedgerRow = {
  id: string;
  instructor_id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  instructor_share_cents: number;
  currency: string;
};

export type PayoutPreviewInstructor = {
  instructorId: string;
  displayName: string;
  salesCount: number;
  pendingCents: number;
  currency: string;
  rail: "stripe_connect" | "manual";
  railReady: boolean;
  railNote: string;
  eligible: boolean;
  /** Manual rail only: what the founder needs to send the transfer. */
  bank: { iban: string | null; accountHolder: string | null; country: string | null } | null;
  reversalFailedCount: number;
};

export type PayoutPreview = {
  instructors: PayoutPreviewInstructor[];
  totalPendingCents: number;
  reversalFailedTotal: number;
};

/** Display names for instructors: instructors → user_profiles, merged in code
 *  (both FK auth.users — nested selects don't work here; see CLAUDE.md). */
async function displayNames(
  db: SupabaseClient,
  instructorIds: string[]
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (instructorIds.length === 0) return names;
  const { data: instructors } = await db
    .from("instructors")
    .select("id, user_id, slug")
    .in("id", instructorIds);
  const userIds = (instructors ?? []).map((i) => i.user_id);
  const { data: profiles } = await db
    .from("user_profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name as string | null])
  );
  for (const i of instructors ?? []) {
    names.set(i.id, nameByUser.get(i.user_id) ?? i.slug ?? i.id);
  }
  return names;
}

export async function buildPayoutPreview(
  db: SupabaseClient
): Promise<PayoutPreview> {
  const { data: pending, error } = await db
    .from("instructor_payouts")
    .select("id, instructor_id, instructor_share_cents, currency, status")
    .in("status", ["pending", "reversal_failed"]);
  if (error) throw new Error(`Ledger read failed: ${error.message}`);

  const byInstructor = new Map<
    string,
    { pendingCents: number; salesCount: number; currency: string; reversalFailed: number }
  >();
  for (const r of pending ?? []) {
    const entry =
      byInstructor.get(r.instructor_id) ??
      { pendingCents: 0, salesCount: 0, currency: r.currency ?? "eur", reversalFailed: 0 };
    if (r.status === "pending") {
      entry.pendingCents += r.instructor_share_cents;
      entry.salesCount += 1;
    } else {
      entry.reversalFailed += 1;
    }
    byInstructor.set(r.instructor_id, entry);
  }

  const ids = Array.from(byInstructor.keys());
  const [names, { data: connects }, { data: billings }] = await Promise.all([
    displayNames(db, ids),
    ids.length
      ? db
          .from("instructor_connect_accounts")
          .select("instructor_id, transfers_status, payouts_enabled")
          .in("instructor_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? db
          .from("instructor_billing")
          .select("instructor_id, country, iban, account_holder")
          .in("instructor_id", ids)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const connectById = new Map((connects ?? []).map((c) => [c.instructor_id, c]));
  const billingById = new Map((billings ?? []).map((b) => [b.instructor_id, b]));

  const instructors: PayoutPreviewInstructor[] = [];
  let totalPendingCents = 0;
  let reversalFailedTotal = 0;
  for (const [instructorId, agg] of Array.from(byInstructor.entries())) {
    const connect = connectById.get(instructorId);
    const billing = billingById.get(instructorId);
    const connectActive =
      connect?.transfers_status === "active" && connect?.payouts_enabled === true;
    const rail: "stripe_connect" | "manual" = connectActive
      ? "stripe_connect"
      : "manual";
    const railReady = connectActive || !!billing?.iban;
    const railNote = connectActive
      ? "Stripe transfer (automatic)"
      : billing?.iban
        ? "Manual transfer (Wise/SEPA) — mark paid after sending"
        : connect
          ? "Stripe onboarding not finished"
          : "No payout details on file — do not pay";
    const overThreshold = agg.pendingCents >= PAYOUT_MIN_CENTS;

    totalPendingCents += agg.pendingCents;
    reversalFailedTotal += agg.reversalFailed;
    instructors.push({
      instructorId,
      displayName: names.get(instructorId) ?? instructorId,
      salesCount: agg.salesCount,
      pendingCents: agg.pendingCents,
      currency: agg.currency,
      rail,
      railReady,
      railNote: overThreshold
        ? railNote
        : `Under €${PAYOUT_MIN_CENTS / 100} — rolls over`,
      eligible: overThreshold && railReady,
      bank:
        rail === "manual" && billing
          ? {
              iban: billing.iban ?? null,
              accountHolder: billing.account_holder ?? null,
              country: billing.country ?? null,
            }
          : null,
      reversalFailedCount: agg.reversalFailed,
    });
  }
  instructors.sort((a, b) => b.pendingCents - a.pendingCents);
  return { instructors, totalPendingCents, reversalFailedTotal };
}

/**
 * Resolve (and persist) the charge id behind a ledger row. Rows written since
 * the Connect build carry stripe_payment_intent_id from the webhook; older
 * rows resolve via their Checkout Session. Persisting makes the lookup
 * one-time per row.
 */
async function ensureChargeId(
  stripe: Stripe,
  db: SupabaseClient,
  row: LedgerRow
): Promise<string> {
  if (row.stripe_charge_id) return row.stripe_charge_id;
  let pi = row.stripe_payment_intent_id;
  if (!pi) {
    const session = await stripe.checkout.sessions.retrieve(
      row.stripe_session_id
    );
    pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
    if (!pi) throw new Error(`No payment intent on session ${row.stripe_session_id}`);
  }
  const intent = await stripe.paymentIntents.retrieve(pi);
  const chargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : intent.latest_charge?.id;
  if (!chargeId) throw new Error(`No charge on payment intent ${pi}`);
  await db
    .from("instructor_payouts")
    .update({ stripe_payment_intent_id: pi, stripe_charge_id: chargeId })
    .eq("id", row.id);
  return chargeId;
}

export type PayoutRunInstructorResult = {
  instructorId: string;
  displayName: string;
  rowsPaid: number;
  transferredCents: number;
  errors: string[];
};

export type PayoutRunResult = {
  batchId: string;
  instructors: PayoutRunInstructorResult[];
};

/** Execute the Connect rail: transfers for every eligible pending row. */
export async function runConnectPayouts(
  stripe: Stripe,
  db: SupabaseClient,
  batchId: string
): Promise<PayoutRunResult> {
  const { data: rows, error } = await db
    .from("instructor_payouts")
    .select(
      "id, instructor_id, stripe_session_id, stripe_payment_intent_id, stripe_charge_id, instructor_share_cents, currency"
    )
    .eq("status", "pending")
    .is("stripe_transfer_id", null);
  if (error) throw new Error(`Ledger read failed: ${error.message}`);

  const { data: connects } = await db
    .from("instructor_connect_accounts")
    .select("instructor_id, stripe_account_id, transfers_status, payouts_enabled");
  const accountByInstructor = new Map(
    (connects ?? [])
      .filter((c) => c.transfers_status === "active" && c.payouts_enabled)
      .map((c) => [c.instructor_id, c.stripe_account_id as string])
  );

  const byInstructor = new Map<string, LedgerRow[]>();
  for (const r of (rows ?? []) as LedgerRow[]) {
    if (!accountByInstructor.has(r.instructor_id)) continue; // manual rail or not onboarded
    const list = byInstructor.get(r.instructor_id) ?? [];
    list.push(r);
    byInstructor.set(r.instructor_id, list);
  }

  const names = await displayNames(db, Array.from(byInstructor.keys()));
  const results: PayoutRunInstructorResult[] = [];

  for (const [instructorId, ledger] of Array.from(byInstructor.entries())) {
    const sum = ledger.reduce((s, r) => s + r.instructor_share_cents, 0);
    if (sum < PAYOUT_MIN_CENTS) continue; // rolls over

    const destination = accountByInstructor.get(instructorId)!;
    const result: PayoutRunInstructorResult = {
      instructorId,
      displayName: names.get(instructorId) ?? instructorId,
      rowsPaid: 0,
      transferredCents: 0,
      errors: [],
    };

    for (const row of ledger) {
      try {
        const chargeId = await ensureChargeId(stripe, db, row);
        const transfer = await stripe.transfers.create(
          {
            amount: row.instructor_share_cents,
            currency: row.currency || "eur",
            destination,
            source_transaction: chargeId,
            description: `LeanSporty payout ${batchId} — sale ${row.stripe_session_id}`,
            metadata: {
              payout_id: row.id,
              instructor_id: instructorId,
              batch_id: batchId,
            },
          },
          { idempotencyKey: `payout-transfer-${row.id}` }
        );
        const { error: updateErr } = await db
          .from("instructor_payouts")
          .update({
            status: "paid",
            paid_via: "stripe_connect",
            stripe_transfer_id: transfer.id,
            payout_batch_id: batchId,
            paid_at: new Date().toISOString(),
            transfer_error: null,
          })
          .eq("id", row.id)
          .eq("status", "pending");
        if (updateErr) {
          // Transfer exists but the row didn't record it — metadata.payout_id
          // and the idempotency key make this recoverable; flag loudly.
          result.errors.push(
            `Row ${row.id}: transfer ${transfer.id} created but DB update failed: ${updateErr.message}`
          );
          continue;
        }
        result.rowsPaid += 1;
        result.transferredCents += row.instructor_share_cents;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        result.errors.push(`Row ${row.id}: ${message}`);
        await db
          .from("instructor_payouts")
          .update({ transfer_error: message })
          .eq("id", row.id)
          .eq("status", "pending");
      }
    }
    results.push(result);
  }

  return { batchId, instructors: results };
}

/**
 * Manual rail: after the founder sends the Wise/Payoneer transfer, mark the
 * instructor's pending rows paid under this batch. Returns what was marked.
 */
export async function markManualPaid(
  db: SupabaseClient,
  instructorId: string,
  batchId: string
): Promise<{ rowsPaid: number; totalCents: number }> {
  const { data: rows, error } = await db
    .from("instructor_payouts")
    .select("id, instructor_share_cents")
    .eq("instructor_id", instructorId)
    .eq("status", "pending");
  if (error) throw new Error(`Ledger read failed: ${error.message}`);
  if (!rows || rows.length === 0) return { rowsPaid: 0, totalCents: 0 };

  const { error: updateErr } = await db
    .from("instructor_payouts")
    .update({
      status: "paid",
      paid_via: "manual",
      payout_batch_id: batchId,
      paid_at: new Date().toISOString(),
    })
    .eq("instructor_id", instructorId)
    .eq("status", "pending");
  if (updateErr) throw new Error(`Mark-paid failed: ${updateErr.message}`);

  return {
    rowsPaid: rows.length,
    totalCents: rows.reduce((s, r) => s + r.instructor_share_cents, 0),
  };
}
