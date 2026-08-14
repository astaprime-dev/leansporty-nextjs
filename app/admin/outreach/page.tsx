import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OutreachPanel } from "@/components/admin/outreach-panel";

export const metadata = {
  title: "Outreach",
  robots: { index: false, follow: false },
};

/**
 * Founder-only outreach console — the top of the instructor funnel.
 *
 * docs/INSTRUCTOR_OUTREACH.md defines the ICP, the 3-touch sequence and the
 * claims discipline; this page is where that playbook is actually worked. One
 * deduplicated prospect list, a due-today queue, and the invite mint that used
 * to be hand-written SQL.
 *
 * Sending stays manual by design: Meta blocks business-initiated DMs outside a
 * 24-hour reply window and prohibits cold outreach, so the tool fills in the
 * message and you tap send. Guarded by the 'admin' role in app_metadata (set
 * once in the Supabase dashboard — see docs/INSTRUCTOR_PAYOUTS.md).
 */
export default async function AdminOutreachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.app_metadata?.roles?.includes("admin")) redirect("/");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">
        Outreach
      </h1>
      <p className="text-gray-600 mt-1">
        <span className="font-medium text-gray-800">Find</span> leads city by
        city · <span className="font-medium text-gray-800">Review</span> who
        fits · <span className="font-medium text-gray-800">Send</span> by hand.
        One deduplicated list underneath; messages are copied to your clipboard
        — you send them yourself.
      </p>
      <div className="mt-8">
        <OutreachPanel />
      </div>
    </div>
  );
}
