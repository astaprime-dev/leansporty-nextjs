import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import { runConnectPayouts } from "@/lib/payouts";

export const runtime = "nodejs";
// Transfers are one Stripe call per ledger row — allow a long run.
export const maxDuration = 300;

/**
 * POST /api/admin/payouts/run   Body: { batchId?: string }
 *
 * Executes the Connect rail of the payout run: a transfer per pending ledger
 * row for every instructor with an active Stripe payout account and ≥ €20
 * pending. Manual-rail instructors are untouched (they're paid via the
 * mark-paid route after the founder sends the money). Safe to re-run: paid
 * rows are excluded and transfer creation is idempotent per row.
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
    const batchId =
      typeof body?.batchId === "string" && /^[\w.-]{1,40}$/.test(body.batchId)
        ? body.batchId
        : new Date().toISOString().slice(0, 7); // YYYY-MM

    const result = await runConnectPayouts(
      getStripe(),
      getServiceRoleClient(),
      batchId
    );
    console.log(
      `Payout run ${batchId}: ${result.instructors.length} instructor(s), ` +
        result.instructors
          .map((i) => `${i.displayName}=${i.transferredCents}c/${i.rowsPaid}rows err=${i.errors.length}`)
          .join("; ")
    );
    return NextResponse.json(result);
  } catch (e) {
    console.error("Payout run failed:", e);
    return NextResponse.json({ error: "run failed" }, { status: 500 });
  }
}
