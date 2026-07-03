# Stripe account setup for Lean Sporty

Everything needed to stand up a **dedicated Stripe account for Lean Sporty** and take
it live. Lean Sporty must have its **own** Stripe account — not share the "22 Skills"
one — so that checkout shows the Lean Sporty brand, payouts/VAT/reporting are clean,
and the account is tied to the correct legal entity (**Astaprime Sp. z o.o.**, PL).

You do **not** need a new Stripe login/email — add a second account under your existing
login and switch between them in the dashboard's account dropdown.

Related runbooks: `INSTRUCTOR_PAYOUTS.md` (paying instructors), `ABANDONED_CHECKOUT_RECOVERY.md`.

---

## 1. Create the account

Stripe dashboard → account dropdown (top-left) → **Create → Create account**.
(Not "Create organization" — that's for grouping many accounts; you don't need it.)

- Name it **Lean Sporty**.
- Country/entity: register to **Astaprime Sp. z o.o.** (Poland) with its business
  details and **bank account** for payouts.

## 2. Branding (this is what fixes the "22 Skills logo" on checkout)

**Settings → Business → Branding**:
- Business/public name: **Lean Sporty**
- Logo + icon
- Brand color: the pink/rose accent (`#EC4899`-ish)

Checkout, receipts, and emails all pull from here.

## 3. Turn OFF Adaptive Pricing

**Settings → Payments** (search "Adaptive pricing") → **off**.

Our ledger and earnings assume single-currency **EUR**. Adaptive Pricing shows buyers a
converted local currency (e.g. US$) and would record mixed-currency payout rows.
Multi-currency / regional pricing is deferred (plan E2.8) — keep EUR-only for now.

## 4. Products — nothing to prepopulate

Do **not** create products in the dashboard. The app creates them via the API:
- The **21-Day Challenge** product needs its `stripe_price_id` set once (seed).
- **Paid live classes** are created on the fly — one shared "Lean Sporty live class"
  Stripe Product with a pool of Prices reused by amount (see `stripe_class_prices`).

## 5. API keys

**Developers → API keys**. You'll use two modes:
- **Test mode** (`sk_test_…`) — for local/staging validation.
- **Live mode** (`sk_live_…`) — for real sales. Reveal and store securely.

## 6. Webhook endpoint

The webhook is the **only** thing that grants access + records payouts. It must be
reachable and signed.

**Events to subscribe (all modes):**
- `checkout.session.completed`
- `checkout.session.expired`
- `charge.refunded`
- `charge.dispute.created`

**Local testing:** `stripe listen --forward-to localhost:3000/api/stripe/webhook`
(exact path — a wrong path silently 404s). Use the `whsec_…` it prints.

**Production:** **Developers → Webhooks → Add endpoint** →
`https://leansporty.com/api/stripe/webhook`, subscribe the four events above, copy its
signing secret.

## 7. Environment variables

Set in **both** `.env.local` (local) and **Vercel** (prod). Prod uses **live** values;
local uses **test** values.

| Var | Where from |
|---|---|
| `STRIPE_SECRET_KEY` | API keys (test `sk_test_…` local / live `sk_live_…` prod) |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` (local) / the prod webhook endpoint (Vercel) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` is the silent killer.** Without it the webhook can't
write — checkout "succeeds" but grants nothing. It must be set in Vercel too.

Restart the dev server after editing `.env.local` (Next reads env at boot).

## 8. VAT / tax (decide before the first live sale)

EU digital-goods VAT/OSS applies from sale #1 (Astaprime is PL). Two options (OD-1):
- **Stripe Tax** (`automatic_tax`, flip `STRIPE_AUTOMATIC_TAX=true`) — you remain
  merchant of record and file.
- **Merchant-of-record** (Paddle/Lemon Squeezy, ~5%) — they handle all VAT.

For a solo operator, MoR removes the most admin. Decide, then wire it.

## 9. Validate in the new account (test mode)

Repeat the proven flow against the **new account's** test keys + `stripe listen`:
1. Create a €15 paid class.
2. Buy it from a second account (card `4242 4242 4242 4242`).
3. Confirm: one `entitlements` row + one `stream_enrollments` roster row + one
   `instructor_payouts` row (`gross 1500, split 85, fee 225, share 1275, pending`);
   buyer can watch and appears on the roster/earnings.
4. Refund it → all three rows reverse.

(This exact flow was validated 2026-07-03 against the shared 22 Skills sandbox — the
code is proven; you're just re-pointing it at the Lean Sporty account.)

## 10. Go live

1. All migrations applied to prod Supabase ✅ (done 2026-07-03).
2. Switch env to **live** keys + the **live** webhook endpoint (Vercel).
3. Branding + Adaptive-Pricing-off + VAT configured (steps 2, 3, 8).
4. Seed the **21-Day Challenge** `stripe_price_id` (create the €49 Price in the live
   account, put its id in the product row).
5. Do one **real** low-value purchase (and refund it) end-to-end before announcing.

> Note: paid **live classes** gate on the roster/entitlement at the page level, not
> signed Cloudflare URLs — so the `ALLOW_UNSIGNED_PLAYBACK` / Cloudflare signing-key
> work only matters for the 21-Day **Challenge** VOD, not for live-class checkout.
