import { getServiceRoleClient } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { renderLeadWelcomeEmail, unsubscribeUrl } from "@/lib/email-templates";

/**
 * Lead capture (E1.7). Records a non-buyer's email at the top of the funnel so it
 * can be pulled into the Phase-3 nurture sequences, and sends a best-effort welcome.
 *
 * Provider integration is deferred (FR-1.7.2): the store is the source of truth and
 * MUST NOT block on email delivery. We write the lead first, then attempt the welcome
 * email in a way that can never fail the capture (errors are swallowed + logged).
 *
 * Server-only: uses the service-role client (the `leads` table has RLS on with no
 * user policies). Never import into a client component.
 */

// Pragmatic email shape check — the real validation is the user receiving the email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 320;
}

export type RecordLeadArgs = {
  email: string;
  /** Where the email was captured, for attribution (e.g. 'challenge-exit'). */
  source: string;
  /** Set when a signed-in user submits; null/undefined for anonymous cold leads. */
  userId?: string | null;
  /** Free-form attribution payload (utm params, intent, etc.). */
  metadata?: Record<string, unknown>;
};

export type RecordLeadResult =
  | { ok: true }
  | { ok: false; reason: "invalid_email" | "store_failed" };

export async function recordLead({
  email: rawEmail,
  source,
  userId,
  metadata,
}: RecordLeadArgs): Promise<RecordLeadResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email" };

  const db = getServiceRoleClient();

  // Upsert: dedupe on the normalized email. created_at/consent_at keep their first-seen
  // defaults (not in the payload), so re-submitting only refreshes source + updated_at.
  const nowIso = new Date().toISOString();
  const { error } = await db.from("leads").upsert(
    {
      email,
      source,
      user_id: userId ?? null,
      metadata: metadata ?? {},
      updated_at: nowIso,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("recordLead: store failed", error.message);
    return { ok: false, reason: "store_failed" };
  }

  // Best-effort welcome email — never blocks or fails the capture (FR-1.7.2).
  void sendWelcomeEmail(db, email);

  return { ok: true };
}

/**
 * Fire-and-forget welcome send, suppressed against the shared opt-out list. Any
 * failure (missing RESEND_API_KEY in dev, Resend error, opt-out) is logged and
 * swallowed — the lead is already stored, which is what acceptance requires.
 */
async function sendWelcomeEmail(
  db: ReturnType<typeof getServiceRoleClient>,
  email: string
): Promise<void> {
  try {
    const { data: optOut } = await db
      .from("email_opt_outs")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (optOut) return;

    const { subject, html } = renderLeadWelcomeEmail({ email });
    await sendEmail({
      to: email,
      subject,
      html,
      // One-click unsubscribe for inbox compliance, mirroring the recovery sends.
      headers: { "List-Unsubscribe": `<${unsubscribeUrl(email)}>` },
    });

    await db.from("leads").update({ status: "welcomed" }).eq("email", email);
  } catch (err) {
    console.error(
      "sendWelcomeEmail: best-effort send failed",
      err instanceof Error ? err.message : String(err)
    );
  }
}
