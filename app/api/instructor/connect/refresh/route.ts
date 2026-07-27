import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * GET /api/instructor/connect/refresh
 *
 * Stripe redirects the instructor here when their onboarding Account Link
 * expires mid-flow (links are single-use and short-lived). Mint a fresh link
 * for the same account and continue seamlessly; on any failure land back on
 * the payout-details page, which offers the "Continue setup" button.
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const fallback = `${origin}/instructor/earnings/payout-details?connect=error`;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(fallback);

    const { data: instructor } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!instructor) return NextResponse.redirect(fallback);

    const { data: connect } = await supabase
      .from("instructor_connect_accounts")
      .select("stripe_account_id")
      .eq("instructor_id", instructor.id)
      .maybeSingle();
    if (!connect) return NextResponse.redirect(fallback);

    const link = await getStripe().accountLinks.create({
      account: connect.stripe_account_id,
      type: "account_onboarding",
      refresh_url: `${origin}/api/instructor/connect/refresh`,
      return_url: `${origin}/instructor/earnings/payout-details?connect=return`,
    });
    return NextResponse.redirect(link.url);
  } catch (e) {
    console.error("Connect refresh failed:", e);
    return NextResponse.redirect(fallback);
  }
}
