import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import {
  backfillBillingFromAccount,
  deriveConnectState,
  syncConnectAccountRow,
} from "@/lib/connect-accounts";
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
      "legal_name, business_name, business_status, tin, vat_number, address_line, city, postal_code, country, iban, account_holder, payout_method"
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
        connectRow.stripe_account_id,
        { expand: ["individual"] }
      );
      const db = getServiceRoleClient();
      await syncConnectAccountRow(db, account);
      // Import name/address collected by Stripe during onboarding — the app
      // never asks for what Stripe already has.
      await backfillBillingFromAccount(db, instructor.id, account);
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

  // The instructor's saved choice wins; before any choice, preselect what
  // matches what exists (Stripe account > saved bank account > country fit).
  // Country here is ONLY their declared tax residence — never browser/IP.
  const savedMethod =
    billing?.payout_method === "stripe" || billing?.payout_method === "manual"
      ? billing.payout_method
      : null;
  // Which method the payout run would ACTUALLY use right now (mirrors
  // lib/payouts.ts): an explicit 'manual' choice overrides an active Stripe
  // account; otherwise Stripe when active, else the saved bank account.
  const stripeReady = connectState === "active";
  const bankReady = !!billing?.iban;
  const activeMethod: "stripe" | "manual" | null =
    savedMethod === "manual"
      ? bankReady
        ? "manual"
        : null
      : stripeReady
        ? "stripe"
        : bankReady
          ? "manual"
          : null;

  // Open the card of the method that actually pays them, so the expanded card
  // and the "Used for your payouts" badge always agree at first glance.
  const defaultMethod: "stripe" | "manual" =
    activeMethod ??
    savedMethod ??
    (connectRow
      ? "stripe"
      : billing && !isConnectSupportedCountry(billing.country)
        ? "manual"
        : "stripe");

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
        minimum (smaller balances roll over). You can change everything here at
        any time.
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Visible only to you and Lean Sporty.
      </p>

      <div className="mt-8">
        <PayoutMethodCard
          defaultMethod={defaultMethod}
          activeMethod={activeMethod}
          connectState={connectState}
          initial={(billing as BillingInitial) ?? null}
        />
      </div>
    </div>
  );
}
