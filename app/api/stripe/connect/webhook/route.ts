import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import { syncConnectAccountRow } from "@/lib/connect-accounts";

export const runtime = "nodejs";

/**
 * POST /api/stripe/connect/webhook
 *
 * Connect (connected-account) events. These are delivered by a SEPARATE Stripe
 * webhook endpoint ("Listen to events on Connected accounts") with its own
 * signing secret — STRIPE_CONNECT_WEBHOOK_SECRET, not the payment webhook's.
 *
 * account.updated keeps instructor_connect_accounts in sync (capability +
 * requirement changes can happen any time after onboarding, e.g. Stripe asking
 * for more verification once volume grows). Unknown accounts are acknowledged
 * and ignored — the Stripe account may be shared with another app.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text(); // RAW body — do not JSON.parse first
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("Connect webhook signature verification failed:", err);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    try {
      const ours = await syncConnectAccountRow(getServiceRoleClient(), account);
      if (ours) {
        console.log(
          `Connect account synced: ${account.id} transfers=${account.capabilities?.transfers} payouts_enabled=${account.payouts_enabled}`
        );
      }
    } catch (e) {
      console.error(`Connect account sync FAILED for ${account.id}:`, e);
      return NextResponse.json({ error: "sync failed" }, { status: 500 }); // let Stripe retry
    }
  }

  return NextResponse.json({ received: true });
}
