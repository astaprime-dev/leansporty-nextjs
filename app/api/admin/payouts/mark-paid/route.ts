import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { markManualPaid } from "@/lib/payouts";

export const runtime = "nodejs";

/**
 * POST /api/admin/payouts/mark-paid   Body: { instructorId, batchId? }
 *
 * Manual rail: the founder has sent this instructor's balance via Wise/SEPA —
 * record it by flipping their pending ledger rows to paid (paid_via='manual')
 * under the batch. Replaces the old SQL-runbook UPDATE.
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
    if (!user.app_metadata?.roles?.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const instructorId =
      typeof body?.instructorId === "string" ? body.instructorId : null;
    if (!instructorId) {
      return NextResponse.json({ error: "instructorId required" }, { status: 400 });
    }
    const batchId =
      typeof body?.batchId === "string" && /^[\w.-]{1,40}$/.test(body.batchId)
        ? body.batchId
        : new Date().toISOString().slice(0, 7); // YYYY-MM

    const result = await markManualPaid(
      getServiceRoleClient(),
      instructorId,
      batchId
    );
    console.log(
      `Manual payout marked paid: instructor=${instructorId} batch=${batchId} rows=${result.rowsPaid} total=${result.totalCents}c`
    );
    return NextResponse.json({ batchId, ...result });
  } catch (e) {
    console.error("Mark-paid failed:", e);
    return NextResponse.json({ error: "mark-paid failed" }, { status: 500 });
  }
}
