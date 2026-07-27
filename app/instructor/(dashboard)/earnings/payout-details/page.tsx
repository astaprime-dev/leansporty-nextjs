import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import { deriveConnectState, syncConnectAccountRow } from "@/lib/connect-accounts";
import { isConnectSupportedCountry } from "@/lib/payout-regions";
import { PayoutMethodCard } from "@/components/instructor/payout-method-card";
import { type BillingInitial } from "@/components/instructor/payout-details-form";

/**
 * Payout + tax details (agreement §1/§7) — required before the first payout,
 * editable any time. RLS scopes the read/write to the instructor's own row.
 *
 * Instructors in countries Stripe Connect supports set up payouts on Stripe's
 * hosted flow (the card on top); the form below then only collects tax data.
 * Out-of-region instructors keep the bank fields — they're paid manually.
 */
export default async function PayoutDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const { connect: connectParam } = await searchParams;
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

  // Connect state for the card. When the instructor just returned from
  // Stripe's hosted onboarding, re-sync live first — the account.updated
  // webhook may not have landed yet and the card must not say "not finished"
  // to someone who just finished.
  const { data: connectRow } = await supabase
    .from("instructor_connect_accounts")
    .select(
      "stripe_account_id, details_submitted, payouts_enabled, transfers_status, disabled_reason, requirements_due"
    )
    .eq("instructor_id", instructor.id)
    .maybeSingle();

  let connectState = deriveConnectState(connectRow ?? null);
  if (connectParam === "return" && connectRow) {
    try {
      const account = await getStripe().accounts.retrieve(
        connectRow.stripe_account_id
      );
      const db = getServiceRoleClient();
      await syncConnectAccountRow(db, account);
      const { data: fresh } = await db
        .from("instructor_connect_accounts")
        .select(
          "details_submitted, payouts_enabled, transfers_status, disabled_reason, requirements_due"
        )
        .eq("instructor_id", instructor.id)
        .maybeSingle();
      connectState = deriveConnectState(fresh ?? null);
    } catch (e) {
      console.error("Connect return sync failed:", e);
    }
  }

  // Preselect the option that matches what the instructor already has (Stripe
  // account > saved bank account > country fit); they can switch freely.
  const defaultMethod: "stripe" | "manual" = connectRow
    ? "stripe"
    : billing?.iban
      ? "manual"
      : billing && !isConnectSupportedCountry(billing.country)
        ? "manual"
        : "stripe";

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
        Choose how we send you your earnings — payouts go out once a month, €20
        minimum (smaller balances roll over). The tax information here is
        required before your first payout and used for settlement statements
        and statutory platform reporting (DAC7).
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Visible only to you and Lean Sporty.
      </p>

      <div className="mt-8">
        <PayoutMethodCard
          defaultMethod={defaultMethod}
          connectState={connectState}
          initial={(billing as BillingInitial) ?? null}
        />
      </div>
    </div>
  );
}
