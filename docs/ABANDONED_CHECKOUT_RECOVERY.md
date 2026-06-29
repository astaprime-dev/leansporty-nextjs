# Abandoned-checkout recovery (E3.4)

The first email win: when a logged-in buyer starts Stripe Checkout but doesn't pay,
we email them a short recovery sequence to bring them back. No discount; warmth +
a one-click resume into the existing `/challenge` → Checkout funnel.

## How it works

The buyer is **authenticated before Checkout** (`client_reference_id`,
`customer_email`, `metadata.product_id`/`product_slug` are on every session), so an
abandoned session already carries everything we need to follow up.

1. **Checkout** (`app/api/checkout/session/route.ts`) creates payment sessions with a
   **60-minute `expires_at`** so Stripe fires `checkout.session.expired` ~1h after
   abandonment (a genuine buyer completes in minutes). Subscriptions skip `expires_at`
   (Checkout doesn't allow it there).
2. **Webhook** (`app/api/stripe/webhook/route.ts`):
   - `checkout.session.expired` → `recordAbandonment()` inserts a `checkout_recovery`
     row and **sends step 1 inline** (fast first touch, best-effort).
   - `checkout.session.completed` → grants the entitlement, then `markCompletedFor()`
     closes any open recovery (covers buyers who returned via the email).
3. **Daily cron** (`app/api/cron/recover-checkouts`, `0 5 * * *`) sends the remaining
   due steps and is the backstop if the inline step-1 send failed.

Sequence (`lib/checkout-recovery.ts → RECOVERY_SEQUENCE`), delays from abandonment:

| Step | Key | Delay | Sent by |
|---|---|---|---|
| 1 | `reminder` | 0h | webhook (inline at expiry) |
| 2 | `value` | 24h | cron |
| 3 | `lastcall` | 72h | cron |

> **Vercel Hobby caveat:** crons run **daily only**, so follow-ups quantize to ~24h.
> Step 1 is unaffected (it's sent inline by the webhook). On Pro, raise the cron
> frequency in `vercel.json` and the hour-based delays apply precisely.

Each row is advanced by `maybeSendNextStep()`, which short-circuits if the buyer is
now entitled (→ `completed`), opted out (→ `unsubscribed`), or the sequence is done
(→ `exhausted`). One open recovery per `(user, product)` is enforced by a partial
unique index, so retries/repeat abandonments never start overlapping sequences.

## Data

`supabase/migrations/20260629120000_checkout_recovery.sql`:
- `checkout_recovery` — one row per abandoned session + sequence state. RLS on, **no
  user policies** (service-role webhook/cron only, like `entitlements`).
- `email_opt_outs` — unsubscribe suppression (email PK), checked before every send.

## Email

- `lib/email.ts` — Resend wrapper (`RESEND_API_KEY`, `EMAIL_FROM`, `siteUrl()`).
- `lib/email-templates.ts` — branded HTML (Georgia serif display, system sans body,
  pink pill CTA, EU imprint + unsubscribe footer). CTA → `/challenge` with recovery
  UTMs; the existing CTA handles auth → Checkout intent-resume (UX-FR-2).
- `lib/email-token.ts` — HMAC(email) unsubscribe tokens (signed with `CRON_SECRET`).
- `app/api/email/unsubscribe` — GET (link click, HTML confirmation) + POST (RFC 8058
  one-click). Sends `List-Unsubscribe` + `List-Unsubscribe-Post` headers.

## Go-live checklist (ops)

1. **Resend** (reuse the existing account):
   - Create a **new API key** for this project → set `RESEND_API_KEY` in Vercel (+ `.env.local`).
   - **Verify `leansporty.com`** in Resend (add the SPF/DKIM DNS records; DMARC recommended).
   - Set `EMAIL_FROM="Anna at Lean Sporty <anna@leansporty.com>"` on the verified domain.
   - Set `NEXT_PUBLIC_SITE_URL=https://leansporty.com`.
2. **Stripe webhook** — add **`checkout.session.expired`** to the endpoint's event list
   (alongside `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`).
3. **Apply the migration** `20260629120000_checkout_recovery.sql` to prod Supabase.
4. **Cron** — `vercel.json` already schedules `/api/cron/recover-checkouts` daily;
   ensure `CRON_SECRET` is set in Vercel (also signs unsubscribe tokens).

## Testing

- **End-to-end (test mode):** start Checkout, don't pay; ~1h later the session expires
  → check Resend logs / inbox for step 1 and a `checkout_recovery` row (`emails_sent=1`).
  To force without waiting, in Stripe TEST expire the session
  (`stripe checkout sessions expire <id>` or Dashboard) → webhook fires immediately.
- **Cron follow-ups:** `curl -H "Authorization: Bearer $CRON_SECRET" \
  https://leansporty.com/api/cron/recover-checkouts` → returns a per-outcome tally.
  (Delays gate step 2/3 to +24h/+72h; temporarily set `delayHours: 0` to dry-run.)
- **Stop conditions:** complete the purchase → recovery row flips to `completed`, no
  more emails. Click unsubscribe → row flips to `unsubscribed`, address suppressed.
