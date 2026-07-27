import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import { deriveConnectState, syncConnectAccountRow } from "@/lib/connect-accounts";

export const runtime = "nodejs";

/**
 * GET /api/instructor/connect/status
 *
 * Re-syncs the caller's connected-account state live from Stripe and returns
 * the derived UI state. Called when the instructor returns from hosted
 * onboarding (?connect=return) so the card is correct even if the
 * account.updated webhook hasn't landed yet.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { data: instructor } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!instructor) {
      return NextResponse.json({ error: "not an instructor" }, { status: 403 });
    }

    const { data: connect } = await supabase
      .from("instructor_connect_accounts")
      .select("stripe_account_id")
      .eq("instructor_id", instructor.id)
      .maybeSingle();
    if (!connect) return NextResponse.json({ state: "not_started" });

    const account = await getStripe().accounts.retrieve(
      connect.stripe_account_id
    );
    const db = getServiceRoleClient();
    await syncConnectAccountRow(db, account);

    const { data: row } = await db
      .from("instructor_connect_accounts")
      .select(
        "details_submitted, payouts_enabled, transfers_status, disabled_reason, requirements_due"
      )
      .eq("instructor_id", instructor.id)
      .maybeSingle();
    return NextResponse.json({ state: deriveConnectState(row ?? null) });
  } catch (e) {
    console.error("Connect status sync failed:", e);
    return NextResponse.json(
      { error: "Could not check payout status." },
      { status: 500 }
    );
  }
}
