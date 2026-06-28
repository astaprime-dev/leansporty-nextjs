# Phase 1 Go-Live Runbook — 21-Day Dance Challenge

Turns the committed Phase 1 code into a working **buy → entitlement → gated playback**.
All the code is in place; this is the ops/config to wire it to live services.
Do the steps **in order** — step 2 is a hard gate (don't sell against unsigned URLs).

Legend: 🔧 = you run a command · 🖥️ = dashboard/console · ✅ = verification.

---

## 0. Prerequisites
- Access to the Supabase project, the Cloudflare Stream account, and a Stripe account.
- `leansporty.com/.env.local` has `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (already present).

---

## 1. Apply database migrations
🖥️ Supabase SQL editor (or `supabase db push` if the CLI is linked), in order:
1. `supabase/migrations/20260628120000_payments_and_entitlements.sql`
2. `supabase/migrations/20260628130000_workout_progress.sql`

✅ Confirm tables exist: `products`, `product_items`, `entitlements`, `workout_progress`, function `get_playable_uid`, and `workouts.cloudflare_uid`.

---

## 2. Secure the videos (E0.2 — THE LINCHPIN) 🔒
Until this is done every video plays from its raw UID and there is nothing to sell.

🔧 See current state (read-only):
```
node --env-file=.env.local scripts/cloudflare-stream-setup.mjs list
```
🔧 Create the Stream signing key, then paste the two lines it prints into `.env.local`
(and Vercel env) — **server-only, never `NEXT_PUBLIC_`**:
```
node --env-file=.env.local scripts/cloudflare-stream-setup.mjs keys:create
```
🔧 Lock the videos (dry-run first, then apply). Pass specific UIDs, or omit to do all:
```
node --env-file=.env.local scripts/cloudflare-stream-setup.mjs secure            # dry-run
node --env-file=.env.local scripts/cloudflare-stream-setup.mjs secure --yes      # apply
```
✅ Verify each asset is locked and the raw URL 403s:
```
node --env-file=.env.local scripts/cloudflare-stream-setup.mjs verify
```

> **Live recordings (defer):** the spec also wants `requireSignedURLs` defaulted on
> live inputs so recordings inherit it. Doing that now breaks the *current* public
> replay flow, which isn't entitlement-gated yet. Leave it until **E2.2** (gate live
> by entitlement) lands. This runbook secures the VOD challenge assets only.

---

## 3. Set server env (`.env.local` + Vercel)
Fill the placeholders already stubbed in `.env.local` / `.env.example`:
- `SUPABASE_SERVICE_ROLE_KEY` — 🖥️ Supabase → Project Settings → API.
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 🖥️ Stripe → Developers → API keys.
- `CLOUDFLARE_STREAM_KEY_ID`, `CLOUDFLARE_STREAM_KEY_PEM` — from step 2.
- `STRIPE_WEBHOOK_SECRET` — from step 5.
- (`STRIPE_AUTOMATIC_TAX` stays `false` until the VAT decision OD-1 is settled — E1.8.)

---

## 4. Create the Stripe product + price
🖥️ Stripe → Products → add **21-Day Dance Challenge**, a **one-time €49** price. Copy the **Price ID** (`price_…`).

---

## 5. Register the Stripe webhook
🖥️ Stripe → Developers → Webhooks → add endpoint `https://leansporty.com/api/stripe/webhook`,
events: `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`.
Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` (step 3).

🔧 Local testing alternative:
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 6. Seed the product
🖥️ Edit `supabase/seed_challenge.sql`: set `<STRIPE_PRICE_ID>` (step 4) and the 15
`<W…>` workout IDs (each `workouts` row must have its `cloudflare_uid` set). Run it.

✅ `select get_playable_uid('<a-non-preview-workout-id>')` returns **null** for an
un-entitled session, and the Day-1 (preview) workout returns its UID.

---

## 7. Enable magic-link email
🖥️ Supabase → Authentication → enable Email provider + OTP/magic-link, and configure
SMTP (the built-in sender is rate-limited — use a real SMTP/Resend for production).
Without this, cold buyers with no Apple/Google account can't sign in.

---

## 8. Smoke test (CHALLENGE spec §12)
✅ Run end-to-end against the deployed app:
1. Anonymous `/challenge` renders; no signed video loads.
2. Sign in (magic link) → `/my-program`: Day 1 plays, watermarked; Days 2–21 locked.
3. Day 2 → playback token route returns **403** → paywall.
4. "Start the Challenge" → Stripe Checkout (€49) with a real card → redirect to
   `/my-program?purchased=1` → "finalizing access" → all 15 unlock (webhook grant).
5. Replay the webhook event → no duplicate entitlement.
6. Refund the charge → next token request 403s (entitlement revoked).
7. Raw Cloudflare UID without a token → **403** (step 2 verified).

---

## Done = Phase 1 cash milestone
A cold visitor can buy the challenge and watch it, fulfilment-free, content secured.
Next: validate price (sell to real traffic) before building Phase 2 (cohorts/membership).
