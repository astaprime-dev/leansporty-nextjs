import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import {
  recordAbandonment,
  maybeSendNextStep,
  markCompletedFor,
} from "@/lib/checkout-recovery";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 *
 * THE ONLY place entitlements are granted from Stripe. It runs without a user
 * session, so it uses the service-role client (bypasses RLS). The signature is
 * verified against the RAW body before anything is written.
 *
 * A missed/late webhook means a buyer paid and can't watch → Sev-1. Every grant
 * and revoke is logged with its stripe_session_id; signature failures are logged.
 *
 * Idempotent: events are delivered more than once. The grant upserts on
 * (user_id, product_id); revokes are safe to repeat.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text(); // RAW body — do not JSON.parse first
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  const db = getServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      const productId = s.metadata?.product_id;
      const expiresAt = s.metadata?.expires_at ?? null; // null = lifetime; set for membership

      if (!userId || !productId) {
        // No LeanSporty identifiers → not our event (this Stripe account is
        // shared with another app). Acknowledge and ignore.
        return NextResponse.json({ received: true });
      }

      // Confirm the product is ours before writing. Guards against another app's
      // sessions on this shared account (a stray product_id would otherwise hit
      // the entitlements FK and make Stripe retry forever).
      const { data: ourProduct } = await db
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();
      if (!ourProduct) {
        console.log(
          `Ignoring checkout.session.completed for unknown product_id=${productId} (session ${s.id}) — not a LeanSporty product.`
        );
        return NextResponse.json({ received: true });
      }

      const { error } = await db.from("entitlements").upsert(
        {
          user_id: userId,
          product_id: productId,
          source: "stripe",
          stripe_session_id: s.id,
          expires_at: expiresAt,
        },
        { onConflict: "user_id,product_id" }
      );
      if (error) {
        console.error(`Entitlement grant FAILED for session ${s.id}:`, error);
        return NextResponse.json({ error: "grant failed" }, { status: 500 }); // let Stripe retry
      }
      console.log(
        `Entitlement granted: user=${userId} product=${productId} session=${s.id}`
      );
      // They bought (possibly via a recovery link / new session) → stop any open
      // recovery sequence for this (user, product). Best-effort; never fail the grant.
      try {
        await markCompletedFor(db, userId, productId);
      } catch (e) {
        console.error("Failed to close recovery row on purchase:", e);
      }
      break;
    }

    // Abandoned checkout (session expired without payment) → start the recovery
    // sequence. The buyer was authenticated before checkout, so the session carries
    // user + email + product. Send the first touch inline; the daily cron sends the
    // follow-ups and is the backstop if this send fails.
    case "checkout.session.expired": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      const productId = s.metadata?.product_id;
      const productSlug = s.metadata?.product_slug;
      const email = s.customer_email ?? s.customer_details?.email ?? null;

      if (!userId || !productId || !productSlug || !email) {
        // Missing our identifiers (another app's session on this shared account, or
        // a pre-recovery session without product_slug) → acknowledge and ignore.
        return NextResponse.json({ received: true });
      }

      const { data: ourProduct } = await db
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();
      if (!ourProduct) return NextResponse.json({ received: true });

      try {
        const row = await recordAbandonment(db, {
          sessionId: s.id,
          userId,
          email,
          productId,
          productSlug,
        });
        if (row) {
          try {
            await maybeSendNextStep(db, row);
          } catch (e) {
            console.error(
              `Recovery step-1 send failed for session ${s.id} (cron will retry):`,
              e
            );
          }
        }
      } catch (e) {
        console.error(`recordAbandonment failed for session ${s.id}:`, e);
      }
      break;
    }

    // Full refund or chargeback → revoke the entitlement bought in that session.
    case "charge.refunded":
    case "charge.dispute.created": {
      const charge =
        event.type === "charge.refunded"
          ? (event.data.object as Stripe.Charge)
          : (event.data.object as Stripe.Dispute).charge;

      const paymentIntent =
        typeof charge === "string"
          ? charge
          : (charge.payment_intent as string | null);

      if (!paymentIntent) break;

      const sessions = await stripe.checkout.sessions.list({
        payment_intent:
          typeof paymentIntent === "string" ? paymentIntent : undefined,
      });
      const sessionId = sessions.data[0]?.id;
      if (!sessionId) break;

      const { error } = await db
        .from("entitlements")
        .delete()
        .eq("stripe_session_id", sessionId);
      if (error) {
        console.error(`Entitlement revoke FAILED for session ${sessionId}:`, error);
        return NextResponse.json({ error: "revoke failed" }, { status: 500 });
      }
      console.log(
        `Entitlement revoked (${event.type}) for session=${sessionId}`
      );
      break;
    }

    // Membership subscription lifecycle is Phase 2 (E2.3) — not handled here yet.
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
