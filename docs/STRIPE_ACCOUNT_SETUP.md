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

Do **not** create products or prices in the dashboard, and none need seeding:
Checkout defines every price **inline** (`price_data` from the `products` row's
`price_cents`/`currency`), attached to a Stripe Product whose id **is our product
slug** — auto-created on first sale in each mode, name kept in sync. No Stripe ids
are stored in the DB, so the same catalog sells correctly in test mode, live mode,
and any Stripe account, and the Stripe Products list stays bounded by catalog size
(one per class/challenge per mode), never by sales volume.

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
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `stripe listen` prints a second secret for Connect events (local) / the prod **Connected accounts** webhook endpoint (Vercel) — see step 11 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` |

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` is the silent killer.** Without it the webhook can't
write — checkout "succeeds" but grants nothing. It must be set in Vercel too.

Restart the dev server after editing `.env.local` (Next reads env at boot).

## 8. VAT / tax — DECIDED & implemented (2026-07-27)

OD-1 is resolved: **we are the merchant of record** and back VAT out ourselves via
`lib/vat-rates.ts` (home-rate `PAYOUT_VAT_PCT`, default 23, on every EU sale while
under the €10k/yr OSS cross-border threshold; per-country rates once
`VAT_DESTINATION_RATES=true`; non-EU → 0). The instructor split applies to the
net-of-VAT amount — full math in `INSTRUCTOR_PAYOUTS.md`. **Stripe Tax**
(`automatic_tax`, flip `STRIPE_AUTOMATIC_TAX=true`) remains available as an upgrade
path — the webhook already prefers `total_details.amount_tax` when present.

## 9. Validate in the new account (test mode)

Repeat the proven flow against the **new account's** test keys + `stripe listen`:
1. Create a €15 paid class.
2. Buy it from a second account (card `4242 4242 4242 4242`).
3. Confirm: one `entitlements` row + one `stream_enrollments` roster row + one
   `instructor_payouts` row (`gross 1500`, split at the product's `split_pct`
   [default 80], `status pending`);
   buyer can watch and appears on the roster/earnings.
4. Refund it → all three rows reverse.

(This exact flow was validated 2026-07-03 against the shared 22 Skills sandbox — the
code is proven; you're just re-pointing it at the Lean Sporty account.)

## 10. Go live

1. All migrations applied to prod Supabase ✅ (done 2026-07-03).
2. Switch env to **live** keys + the **live** webhook endpoint (Vercel).
3. Branding + Adaptive-Pricing-off + VAT configured (steps 2, 3, 8).
4. Do one **real** low-value purchase (and refund it) end-to-end before announcing.
   (No price seeding needed — prices are inline, see step 4 above.)

> Note: paid **live classes** gate on the roster/entitlement at the page level, not
> signed Cloudflare URLs — so the `ALLOW_UNSIGNED_PLAYBACK` / Cloudflare signing-key
> work only matters for the 21-Day **Challenge** VOD, not for live-class checkout.

## 11. Stripe Connect (instructor payouts — dual rail since 2026-07-27)

Connect is the automated payout rail: charges stay on the platform account
(merchant of record unchanged), and the monthly run at `/admin/payouts` creates
**separate transfers** from the ledger to each instructor's connected account.
Accounts are created by the app (transfers-only capability, Express dashboard,
Stripe-hosted onboarding) — nothing to pre-create in the Dashboard. One-time setup:

1. **Platform profile** — Dashboard → Settings → Connect → Platform profile:
   charge type = **"separate charges and transfers"**, the platform collects fees
   and is **liable for losses/negative balances** (matches the account controller
   settings in code: `fees.payer='application'`, `losses.payments='application'`),
   and acknowledge the loss-liability terms.
2. **Branding** — Settings → Connect → Branding: name, icon, brand color. Shown on
   Stripe's hosted onboarding and in the instructor's Express dashboard.
3. **Connect webhook** — Developers → Webhooks → Add endpoint:
   `https://leansporty.com/api/stripe/connect/webhook`, and select **"Listen to
   events on Connected accounts"** (NOT the default "your account" — Connect events
   sign with a different secret). Event: `account.updated`. Copy the signing secret
   into `STRIPE_CONNECT_WEBHOOK_SECRET` (Vercel + `.env.local`).
   Locally: **`npm run stripe:listen`** — it pins the CLI to the Lean Sporty
   account via `--api-key` from `.env.local` and forwards BOTH webhooks.
   ⚠️ Never run bare `stripe listen`: the CLI's default login is the old
   22skills account (`acct_1FWqvD…`), so it silently listens on the wrong
   account and test purchases hang on "finalizing your access" (learned
   2026-07-27). The printed signing secret goes in BOTH
   `STRIPE_WEBHOOK_SECRET` and `STRIPE_CONNECT_WEBHOOK_SECRET` locally
   (`stripe listen` signs both forwards with one secret; as of 2026-07-27 it is
   the `whsec_ee8fa2…` value already in `.env.local`). Test-mode events have NO
   dashboard endpoint and NO retry — if the listener wasn't running during a
   test purchase, re-deliver with `stripe events resend <evt_…> --api-key …`.
4. **Payout schedule** — leave connected accounts on the default (daily automatic):
   once the run transfers the money, Stripe forwards it to the instructor's bank
   without further action.
5. **Admin role** (one-time) — Supabase dashboard → Authentication → your own user
   → `raw_app_meta_data` → `{"roles": ["admin"]}` — gates `/admin/payouts`.

Country coverage from a PL platform: **EEA + UK (0% cross-border fee), CH/US/CA
(0.25%)** — `lib/payout-regions.ts`. Instructors elsewhere (Ukraine, Brazil, …)
are paid on the **manual rail** (bank details in the payout-details form, Wise/SEPA
send + "Mark paid" on `/admin/payouts`). Full runbook: `docs/INSTRUCTOR_PAYOUTS.md`.

Test-mode e2e: onboard a test instructor (DE test IBAN `DE89370400440532013000`,
OTP `000000`), buy a class with `4242 4242 4242 4242`, run `/admin/payouts`, confirm
the transfer in the Dashboard (linked to the charge), then refund the sale and
confirm the row flips to `reversed`. Re-running immediately must create zero new
transfers.
