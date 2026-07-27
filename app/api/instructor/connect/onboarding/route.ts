import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import { isConnectSupportedCountry } from "@/lib/payout-regions";

export const runtime = "nodejs";

/**
 * POST /api/instructor/connect/onboarding
 *
 * Starts (or resumes) Stripe-hosted Connect onboarding for the calling
 * instructor and returns { url } — an Account Link the client redirects to.
 * Account Links are single-use and short-lived, so a fresh one is minted on
 * every call; that also makes this the "Continue setup" action.
 *
 * The connected account is transfers-only (never processes charges — the
 * platform stays merchant of record), with an Express dashboard and Stripe
 * collecting requirements. The account's country comes from the instructor's
 * saved tax details and is immutable on Stripe, which is why the billing row
 * must exist first.
 */
export async function POST(req: NextRequest) {
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

    // Country of tax residence: from the saved row, or — on first setup —
    // declared right in the Stripe option (one dropdown; everything else is
    // collected by Stripe). NEVER inferred from browser/IP.
    const body = await req.json().catch(() => ({}));
    const { data: billing } = await supabase
      .from("instructor_billing")
      .select("country")
      .eq("instructor_id", instructor.id)
      .maybeSingle();
    const bodyCountry =
      typeof body?.country === "string" && /^[A-Za-z]{2}$/.test(body.country.trim())
        ? body.country.trim().toUpperCase()
        : null;
    const country = billing?.country ?? bodyCountry;
    if (!country) {
      return NextResponse.json(
        { error: "Please choose your country of tax residence first." },
        { status: 409 }
      );
    }
    if (!isConnectSupportedCountry(country)) {
      return NextResponse.json(
        {
          error:
            "Stripe payouts aren't available in your country yet. Choose “By bank transfer” instead — we'll send your earnings manually.",
        },
        { status: 409 }
      );
    }

    const stripe = getStripe();
    const db = getServiceRoleClient();

    // First setup without a saved row: create it with the declared country
    // (name/address are imported from Stripe after onboarding; TIN is asked
    // separately — Stripe doesn't share tax numbers).
    if (!billing) {
      // payout_method stays null here — the choice is recorded only when
      // onboarding actually COMPLETES (see syncConnectAccountRow), so an
      // abandoned Stripe attempt never claims the instructor's payout method.
      const { error } = await db.from("instructor_billing").insert({
        instructor_id: instructor.id,
        country,
        business_status: country !== "PL" ? "foreign" : null,
      });
      if (error && !`${error.code}`.startsWith("23")) {
        console.error("instructor_billing minimal insert failed:", error);
      }
    }

    // Reuse the existing connected account, or create one on first call.
    const { data: existing } = await supabase
      .from("instructor_connect_accounts")
      .select("stripe_account_id")
      .eq("instructor_id", instructor.id)
      .maybeSingle();

    let accountId = existing?.stripe_account_id ?? null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        country,
        email: user.email ?? undefined,
        controller: {
          fees: { payer: "application" },
          losses: { payments: "application" },
          stripe_dashboard: { type: "express" },
          requirement_collection: "stripe",
        },
        capabilities: { transfers: { requested: true } },
        metadata: { instructor_id: instructor.id },
      });
      accountId = account.id;

      const { error } = await db.from("instructor_connect_accounts").insert({
        instructor_id: instructor.id,
        stripe_account_id: account.id,
        country,
      });
      if (error) {
        // A concurrent call may have inserted first — fall back to its account
        // rather than leaving an orphan reference.
        const { data: raced } = await db
          .from("instructor_connect_accounts")
          .select("stripe_account_id")
          .eq("instructor_id", instructor.id)
          .maybeSingle();
        if (!raced) {
          console.error("instructor_connect_accounts insert failed:", error);
          return NextResponse.json(
            { error: "Could not set up payouts. Please try again." },
            { status: 500 }
          );
        }
        accountId = raced.stripe_account_id;
      }
    }

    const origin = req.headers.get("origin") ?? "https://leansporty.com";
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/api/instructor/connect/refresh`,
      return_url: `${origin}/instructor/earnings/payout-details?connect=return`,
    });
    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("Connect onboarding failed:", e);
    return NextResponse.json(
      { error: "Could not set up payouts. Please try again." },
      { status: 500 }
    );
  }
}
