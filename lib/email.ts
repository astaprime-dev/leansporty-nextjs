import { Resend } from "resend";

/**
 * Server-only transactional email via Resend (reuses our existing Resend account;
 * this project needs its own RESEND_API_KEY + a verified sending domain).
 * Never import into a client component — it reads RESEND_API_KEY.
 *
 * EMAIL_FROM must be on a domain verified in Resend (SPF/DKIM), e.g.
 *   "Anna at Lean Sporty <anna@leansporty.com>"
 */
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY");
    _resend = new Resend(key);
  }
  return _resend;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Lean Sporty <hello@leansporty.com>";
}

/**
 * Canonical public origin for links inside emails. Prefer an explicit
 * NEXT_PUBLIC_SITE_URL; fall back to the production domain (never VERCEL_URL,
 * which is a per-deploy preview host).
 */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://leansporty.com"
  );
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  /** Extra headers, e.g. List-Unsubscribe for one-click opt-out. */
  headers?: Record<string, string>;
  /** Where replies go. Defaults to EMAIL_REPLY_TO (a real, monitored inbox). */
  replyTo?: string;
};

/**
 * Send one email. Throws on failure — callers that must not break a critical path
 * (e.g. the Stripe webhook) should wrap this in try/catch and let the cron retry.
 *
 * The From persona (EMAIL_FROM, e.g. "Anna") lives on the sending subdomain and
 * need not be a real mailbox; replies are routed to EMAIL_REPLY_TO instead.
 */
export async function sendEmail({
  to,
  subject,
  html,
  headers,
  replyTo,
}: SendEmailArgs) {
  const reply = replyTo ?? process.env.EMAIL_REPLY_TO;
  const { data, error } = await getResend().emails.send({
    from: emailFrom(),
    to,
    subject,
    html,
    headers,
    ...(reply ? { replyTo: reply } : {}),
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? String(error)}`);
  }
  return data;
}
