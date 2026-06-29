import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import {
  renderRecoveryEmail,
  unsubscribeUrl,
  type RecoveryStepKey,
} from "@/lib/email-templates";

/**
 * Abandoned-checkout recovery — the data-driven sequence + the operations the
 * Stripe webhook and the daily cron share. All DB access here uses the SERVICE-ROLE
 * client (the recovery tables have RLS on with no user policies). Never call from
 * client-reachable code with a user-scoped client.
 *
 * Flow:
 *  - Buyer is authenticated before checkout, so abandonment carries user+email+product.
 *  - Checkout sessions are created with a short expires_at → Stripe fires
 *    `checkout.session.expired` ~1h after abandonment.
 *  - The webhook records the abandonment and best-effort sends step 1 immediately
 *    (fast first touch, no cron dependency).
 *  - The daily cron sends the remaining steps when due and is the backstop for step 1.
 *
 * Delays are HOURS from `created_at` (the abandonment time). On Vercel Hobby crons
 * run daily, so follow-ups quantize to ~24h granularity — adjust the schedule to
 * sub-daily on Pro and these delays apply more precisely.
 */
export const RECOVERY_SEQUENCE: { key: RecoveryStepKey; delayHours: number }[] = [
  { key: "reminder", delayHours: 0 }, // sent inline by the webhook at expiry
  { key: "value", delayHours: 24 },
  { key: "lastcall", delayHours: 72 },
];

export type RecoveryRow = {
  id: string;
  stripe_session_id: string;
  user_id: string;
  email: string;
  product_id: string;
  product_slug: string;
  status: "open" | "completed" | "exhausted" | "unsubscribed";
  emails_sent: number;
  last_email_at: string | null;
  created_at: string;
};

/**
 * Record an abandoned checkout. No-op (returns null) if an open recovery already
 * exists for this (user, product) or this session — so re-tries and repeat
 * abandonments never start overlapping sequences.
 */
export async function recordAbandonment(
  db: SupabaseClient,
  args: {
    sessionId: string;
    userId: string;
    email: string;
    productId: string;
    productSlug: string;
  }
): Promise<RecoveryRow | null> {
  const { data, error } = await db
    .from("checkout_recovery")
    .insert({
      stripe_session_id: args.sessionId,
      user_id: args.userId,
      email: args.email.trim().toLowerCase(),
      product_id: args.productId,
      product_slug: args.productSlug,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation (open row already exists, or duplicate session) → expected, ignore.
    if (error.code === "23505") return null;
    throw error;
  }
  return data as RecoveryRow;
}

/** Close any open recovery for (user, product) — buyer completed (possibly via a new session). */
export async function markCompletedFor(
  db: SupabaseClient,
  userId: string,
  productId: string
): Promise<void> {
  await db
    .from("checkout_recovery")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .eq("status", "open");
}

export type StepOutcome =
  | "sent"
  | "not-due"
  | "exhausted"
  | "completed"
  | "unsubscribed";

/**
 * Advance one recovery row by at most one step. Idempotent-enough for a daily cron:
 * it sends the next due step, or closes the row if the buyer is now entitled, opted
 * out, or the sequence is exhausted. Safe to call repeatedly.
 */
export async function maybeSendNextStep(
  db: SupabaseClient,
  row: RecoveryRow
): Promise<StepOutcome> {
  const idx = row.emails_sent;
  if (idx >= RECOVERY_SEQUENCE.length) {
    await db
      .from("checkout_recovery")
      .update({ status: "exhausted" })
      .eq("id", row.id);
    return "exhausted";
  }

  const nowIso = new Date().toISOString();

  // Opt-out suppression (EU compliance) — stop the sequence permanently.
  const { data: optOut } = await db
    .from("email_opt_outs")
    .select("email")
    .eq("email", row.email)
    .maybeSingle();
  if (optOut) {
    await db
      .from("checkout_recovery")
      .update({ status: "unsubscribed" })
      .eq("id", row.id);
    return "unsubscribed";
  }

  // Entitlement backstop — they may have completed via another session or been comped.
  const { data: ent } = await db
    .from("entitlements")
    .select("id")
    .eq("user_id", row.user_id)
    .eq("product_id", row.product_id)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .maybeSingle();
  if (ent) {
    await markCompletedFor(db, row.user_id, row.product_id);
    return "completed";
  }

  // Timing: step N is due delayHours after abandonment.
  const step = RECOVERY_SEQUENCE[idx];
  const dueAt = new Date(row.created_at).getTime() + step.delayHours * 3_600_000;
  if (Date.now() < dueAt) return "not-due";

  const { subject, html } = renderRecoveryEmail(step.key, {
    email: row.email,
    productSlug: row.product_slug,
  });
  await sendEmail({
    to: row.email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl(row.email)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  const emailsSent = idx + 1;
  await db
    .from("checkout_recovery")
    .update({
      emails_sent: emailsSent,
      last_email_at: nowIso,
      status: emailsSent >= RECOVERY_SEQUENCE.length ? "exhausted" : "open",
    })
    .eq("id", row.id);

  return "sent";
}
