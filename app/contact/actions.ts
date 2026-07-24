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
    await sendEmail({
      to: inbox,
      replyTo: email,
      subject: `Contact form: ${name || email}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { ok: false, error: "Sending failed — please try again in a moment." };
  }
  return { ok: true };
}
