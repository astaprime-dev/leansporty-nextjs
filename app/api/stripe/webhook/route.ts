import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getServiceRoleClient } from "@/lib/stripe";
import {
  recordAbandonment,
  maybeSendNextStep,
  markCompletedFor,
} from "@/lib/checkout-recovery";
import { sendEmail } from "@/lib/email";
import { renderPurchaseConfirmationEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/** Platform fee is at least this per sale (the "€1.50 floor" from BUSINESS_MODEL). */
const MIN_PLATFORM_FEE_CENTS = 150;

/**
 * Split a charged amount into the platform fee and the instructor's share.
 * Platform fee = max((100 - split)% of gross, €1.50 floor), never more than the sale
 * itself. instructor_share = gross - platform_fee (≥ 0).
 */
function computeSplit(
  grossCents: number,
  splitPct: number
): { platformFeeCents: number; instructorShareCents: number } {
  const platformPct = Math.max(0, 100 - splitPct);
  let platformFee = Math.round((grossCents * platformPct) / 100);
  platformFee = Math.max(platformFee, MIN_PLATFORM_FEE_CENTS);
  platformFee = Math.min(platformFee, grossCents); // never exceed the sale
  return {
    platformFeeCents: platformFee,
    instructorShareCents: grossCents - platformFee,
  };
}

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
        .select("id, title, instructor_id, split_pct")
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

      // If this product backs a paid live class: add the buyer to the class roster
      // and record the instructor's payout. Users can't self-insert paid-class
      // rosters (RLS), so this service-role write is the only path. Both are
      // idempotent (roster unique(stream_id,user_id); payout unique(stripe_session_id)).
      try {
        const { data: paidStream } = await db
          .from("live_stream_sessions")
          .select("id")
          .eq("product_id", productId)
          .maybeSingle();

        if (paidStream) {
          await db
            .from("stream_enrollments")
            .upsert(
              { stream_id: paidStream.id, user_id: userId, tokens_paid: 0 },
              { onConflict: "stream_id,user_id" }
            );
        }

        // Payout ledger: what the instructor is owed on this sale.
        if (ourProduct.instructor_id) {
          const gross = s.amount_total ?? 0;
          const splitPct = ourProduct.split_pct ?? 85;
          const { platformFeeCents, instructorShareCents } = computeSplit(
            gross,
            splitPct
          );
          const { error: payoutErr } = await db.from("instructor_payouts").upsert(
            {
              instructor_id: ourProduct.instructor_id,
              product_id: ourProduct.id,
              stream_id: paidStream?.id ?? null,
              user_id: userId,
              stripe_session_id: s.id,
              gross_cents: gross,
              currency: s.currency ?? "eur",
              split_pct: splitPct,
              platform_fee_cents: platformFeeCents,
              instructor_share_cents: instructorShareCents,
              status: "pending",
            },
            { onConflict: "stripe_session_id" }
          );
          if (payoutErr) {
            console.error(
              `Payout ledger write FAILED for session ${s.id}:`,
              payoutErr
            );
          }
        }
      } catch (e) {
        console.error("Paid-class post-processing failed (buyer still entitled):", e);
      }

      // They bought (possibly via a recovery link / new session) → stop any open
      // recovery sequence for this (user, product). Best-effort; never fail the grant.
      try {
        await markCompletedFor(db, userId, productId);
      } catch (e) {
        console.error("Failed to close recovery row on purchase:", e);
      }

      // Transactional purchase confirmation (welcome + access + Start Day 1).
      // Best-effort: a send failure must never fail the entitlement grant.
      const buyerEmail = s.customer_details?.email ?? s.customer_email ?? null;
      if (buyerEmail) {
        try {
          const { subject, html } = renderPurchaseConfirmationEmail({
            productTitle: ourProduct.title,
            amountCents: s.amount_total,
            currency: s.currency,
            expiresAt: expiresAt,
          });
          await sendEmail({ to: buyerEmail, subject, html });
          console.log(`Purchase confirmation sent to ${buyerEmail} (session ${s.id})`);
        } catch (e) {
          console.error(`Purchase confirmation email FAILED for session ${s.id}:`, e);
        }
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

      // Read the entitlement first so we can also remove the matching paid-class
      // roster row (otherwise a refunded buyer keeps a roster row → keeps watch access).
      const { data: revoking } = await db
        .from("entitlements")
        .select("user_id, product_id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

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

      // Remove the paid-class roster row for this buyer, if the product backs a class.
      if (revoking) {
        try {
          const { data: paidStream } = await db
            .from("live_stream_sessions")
            .select("id")
            .eq("product_id", revoking.product_id)
            .maybeSingle();
          if (paidStream) {
            await db
              .from("stream_enrollments")
              .delete()
              .eq("stream_id", paidStream.id)
              .eq("user_id", revoking.user_id);
          }
        } catch (e) {
          console.error("Roster row cleanup on refund failed:", e);
        }
      }

      // Reverse the payout for this sale so a refunded class isn't paid out. (If it
      // was already paid to the instructor, ops reconciles manually — rare.)
      try {
        await db
          .from("instructor_payouts")
          .delete()
          .eq("stripe_session_id", sessionId);
      } catch (e) {
        console.error("Payout reversal on refund failed:", e);
      }
      break;
    }

    // Membership subscription lifecycle is Phase 2 (E2.3) — not handled here yet.
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
