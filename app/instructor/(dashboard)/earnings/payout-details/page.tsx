import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  PayoutDetailsForm,
  type BillingInitial,
} from "@/components/instructor/payout-details-form";

/**
 * Payout + tax details (agreement §1/§7) — required before the first payout,
 * editable any time. RLS scopes the read/write to the instructor's own row.
 */
export default async function PayoutDetailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?redirect=/instructor/earnings/payout-details");

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) redirect("/instructor/profile");

  const { data: billing } = await supabase
    .from("instructor_billing")
    .select(
      "legal_name, business_name, business_status, tin, vat_number, address_line, city, postal_code, country, iban, account_holder"
    )
    .eq("instructor_id", instructor.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/instructor/earnings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Earnings
      </Link>
      <h1 className="mt-4 text-3xl sm:text-4xl font-display font-light text-gray-900">
        Payout details
      </h1>
      <p className="text-gray-600 mt-1">
        Where your monthly bank transfer goes, and the tax details we need to
        pay you. Takes about 3 minutes, once — you can change it any time.
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Only you and Lean Sporty can see this. We use it for your payouts, your
        monthly settlement statements, and the reporting EU law requires of
        platforms (DAC7).
      </p>

      <div className="mt-8 rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
        <PayoutDetailsForm initial={(billing as BillingInitial) ?? null} />
      </div>
    </div>
  );
}
