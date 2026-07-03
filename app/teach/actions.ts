"use server";

import { createClient } from "@/utils/supabase/server";
import { recordLead } from "@/lib/leads";

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

  return {
    status: "success",
    message:
      "Application received — we read every one personally and will get back to you within a few days.",
  };
};
