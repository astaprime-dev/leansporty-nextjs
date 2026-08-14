"use server";

import { after } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordLead } from "@/lib/leads";
import { sendEmail } from "@/lib/email";
import {
  renderTeachApplyFounderAlert,
  renderTeachApplyReceivedEmail,
} from "@/lib/email-templates";

/**
 * Instructor application (the /teach recruiting funnel). Applications land in the
 * existing `leads` table with source 'teach-apply' and the pitch details in
 * `metadata` — no new schema, and the founder reviews/replies by hand while
 * instructor count is small (curated, invite-only activation stays unchanged).
 *
 * State shape mirrors captureLeadAction (useActionState + inline feedback).
 */
export type TeachApplyState = {
  status: "success" | "error";
  message: string;
} | null;

const MAX_FIELD = 500;

export const applyToTeachAction = async (
  _prevState: TeachApplyState,
  formData: FormData
): Promise<TeachApplyState> => {
  // Honeypot (same convention as the contact form): a hidden field humans
  // never see. Bots fill it — pretend to succeed so they learn nothing, and
  // send NO emails: the confirmation send otherwise makes this form a free
  // mail relay for whatever address the bot submitted.
  if (formData.get("website")?.toString().trim()) {
    return {
      status: "success",
      message:
        "Application received — we read every one personally and will get back to you within a few days.",
    };
  }

  const name = formData.get("name")?.toString().trim().slice(0, MAX_FIELD);
  const email = formData.get("email")?.toString().trim();
  const social = formData.get("social")?.toString().trim().slice(0, MAX_FIELD);
  const about = formData.get("about")?.toString().trim().slice(0, 2000);

  if (!name) {
    return { status: "error", message: "Please tell us your name." };
  }
  if (!email) {
    return { status: "error", message: "Please enter your email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await recordLead({
    email,
    source: "teach-apply",
    userId: user?.id ?? null,
    metadata: {
      name,
      social: social || null,
      about: about || null,
    },
    // The lead welcome email pitches the consumer challenge — wrong audience here.
    sendWelcome: false,
  });

  if (!result.ok) {
    return result.reason === "invalid_email"
      ? { status: "error", message: "Please enter a valid email address." }
      : { status: "error", message: "Something went wrong. Please try again." };
  }

  // Close the loop on both sides — best-effort and never blocks the response.
  // after() keeps the serverless function alive for the sends; a plain void
  // promise can be frozen once the action's response goes out.
  after(() =>
    sendTeachApplyEmails({
      name,
      email,
      social: social || null,
      about: about || null,
    })
  );

  return {
    status: "success",
    message:
      "Application received — we read every one personally and will get back to you within a few days.",
  };
};

async function sendTeachApplyEmails(app: {
  name: string;
  email: string;
  social: string | null;
  about: string | null;
}): Promise<void> {
  try {
    const { subject, html } = renderTeachApplyReceivedEmail({ name: app.name });
    await sendEmail({ to: app.email, subject, html });
  } catch (err) {
    console.error(
      "teach-apply: applicant confirmation failed",
      err instanceof Error ? err.message : String(err)
    );
  }

  try {
    const to = process.env.FOUNDER_NOTIFY_EMAIL ?? process.env.EMAIL_REPLY_TO;
    if (!to) {
      console.error(
        "teach-apply: no FOUNDER_NOTIFY_EMAIL/EMAIL_REPLY_TO configured — application is only in the leads table"
      );
      return;
    }
    const { subject, html } = renderTeachApplyFounderAlert(app);
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error(
      "teach-apply: founder alert failed",
      err instanceof Error ? err.message : String(err)
    );
  }
}
