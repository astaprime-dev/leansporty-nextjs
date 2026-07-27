import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PayoutRunPanel } from "@/components/admin/payout-run-panel";

/**
 * Founder-only payout console — the monthly run over the instructor_payouts
 * ledger. Stripe-rail instructors are paid by transfers (one click); manual-
 * rail (out-of-region) instructors are listed with their bank details and
 * marked paid after the founder sends the money via Wise/SEPA. Guarded by the
 * 'admin' role in app_metadata (set once in the Supabase dashboard — see
 * docs/INSTRUCTOR_PAYOUTS.md).
 */
export default async function AdminPayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.app_metadata?.roles?.includes("admin")) redirect("/");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">
        Payout run
      </h1>
      <p className="text-gray-600 mt-1">
        Monthly instructor payouts from the ledger. €20 minimum per instructor —
        smaller balances roll over. Re-running after a partial failure is safe:
        already-paid sales are never paid twice.
      </p>
      <div className="mt-8">
        <PayoutRunPanel />
      </div>
    </div>
  );
}
