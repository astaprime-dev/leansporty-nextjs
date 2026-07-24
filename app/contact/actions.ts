"use server";

import { sendEmail } from "@/lib/email";

export type ContactState = {
  ok: boolean;
  error?: string;
} | null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Contact form → email to the monitored support inbox (SUPPORT_INBOX, falling
 * back to EMAIL_REPLY_TO). The sender's address goes into Reply-To so answering
 * is one click. The address itself is never rendered on the site (anti-spam);
 * the `website` field is a honeypot — bots fill it, humans never see it.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: silently "succeed" so bots learn nothing.
  if ((formData.get("website") as string)?.trim()) return { ok: true };

  const name = ((formData.get("name") as string) ?? "").trim().slice(0, 100);
  const email = ((formData.get("email") as string) ?? "").trim().slice(0, 200);
  const message = ((formData.get("message") as string) ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Please tell us a little more (at least a sentence)." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "That's a bit long — please keep it under 5000 characters." };
  }

  const inbox = process.env.SUPPORT_INBOX ?? process.env.EMAIL_REPLY_TO;
  if (!inbox) {
    console.error("Contact form: no SUPPORT_INBOX / EMAIL_REPLY_TO configured");
    return { ok: false, error: "Something went wrong on our side — please try again later." };
  }

  try {
    // Formatting matters for deliverability of self-notifications: no raw
    // email address in the subject, and no "From:" line in the body (a body
    // claiming a different sender than the envelope reads as phishing).
    await sendEmail({
      to: inbox,
      replyTo: email,
      subject: `New contact form message${name ? ` from ${name}` : ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px">
          <h2 style="font-size:16px">New message via the Lean Sporty contact form</h2>
          <p style="white-space:pre-wrap;border-left:3px solid #ec4899;padding-left:12px">${escapeHtml(message)}</p>
          <p style="color:#6b7280;font-size:13px">
            Sent by ${escapeHtml(name || "a visitor")} (${escapeHtml(email)}).
            Just hit reply — it goes straight to them.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { ok: false, error: "Sending failed — please try again in a moment." };
  }
  return { ok: true };
}
