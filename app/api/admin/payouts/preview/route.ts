import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { buildPayoutPreview } from "@/lib/payouts";

export const runtime = "nodejs";

/**
 * GET /api/admin/payouts/preview
 *
 * What the next payout run would do — per-instructor pending balance, rail
 * (Stripe transfer vs manual Wise/SEPA), eligibility, bank details for the
 * manual rail, and reversal_failed rows needing reconciliation. Read-only:
 * nothing is written to Stripe or the ledger.
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
    // Admin-only (DEF-2): the requesting user must carry the 'admin' role.
    if (!user.app_metadata?.roles?.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const preview = await buildPayoutPreview(getServiceRoleClient());
    return NextResponse.json(preview);
  } catch (e) {
    console.error("Payout preview failed:", e);
    return NextResponse.json({ error: "preview failed" }, { status: 500 });
  }
}
