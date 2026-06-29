import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  maybeSendNextStep,
  type RecoveryRow,
  type StepOutcome,
} from "@/lib/checkout-recovery";

export const runtime = "nodejs";

/**
 * Abandoned-checkout recovery cron (E3.4).
 *
 * Sends the next due email for every open recovery, and closes rows whose buyer is
 * now entitled / opted out / sequence-exhausted. The webhook already sends step 1
 * inline at session expiry; this cron sends the follow-ups and is the backstop if
 * that inline send failed.
 *
 * Schedule: daily (Vercel Hobby allows only daily crons). On Pro, raise the
 * frequency in vercel.json for tighter sequence timing.
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceRoleClient();
  const { data: rows, error } = await db
    .from("checkout_recovery")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[recover-checkouts] query failed:", error);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const tally: Record<StepOutcome | "error", number> = {
    sent: 0,
    "not-due": 0,
    exhausted: 0,
    completed: 0,
    unsubscribed: 0,
    error: 0,
  };

  for (const row of (rows ?? []) as RecoveryRow[]) {
    try {
      const outcome = await maybeSendNextStep(db, row);
      tally[outcome]++;
    } catch (e) {
      tally.error++;
      console.error(
        `[recover-checkouts] failed for recovery ${row.id} (session ${row.stripe_session_id}):`,
        e
      );
    }
  }

  console.log(
    `[recover-checkouts] scanned ${rows?.length ?? 0} open rows:`,
    tally
  );
  return NextResponse.json({
    success: true,
    scanned: rows?.length ?? 0,
    ...tally,
    timestamp: new Date().toISOString(),
  });
}
