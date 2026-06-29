---
name: stripe-commerce
description: This skill should be used when implementing payments and access grants — when the user asks to "add Stripe", "create a checkout session", "build the Stripe webhook", "grant an entitlement on purchase", "handle refunds/chargebacks", "add a membership subscription", "add a product", or "set up Stripe Connect". Encodes the Checkout → webhook → entitlements flow and the rule that the webhook is the only entitlement writer.
version: 0.1.0
---

# Stripe commerce for LeanSporty

Implements selling on the web with Stripe and granting access via the `entitlements` table. Sold on web (keep ~97% vs. app-store IAP). The system has **no payments today** — this is greenfield. The deprecated "tokens" model is not extended; entitlements replace it.

## The architecture (and its one rule)

```
Buyer ─ POST /api/checkout/session ─→ Stripe hosted Checkout ─ pays ─→ success_url
                                                                  │
                Stripe ─ POST /api/stripe/webhook (verified) ─────┘
                          checkout.session.completed → upsert entitlement (service-role)
```

**THE RULE: the Stripe webhook is the *only* place that writes `entitlements`.** It runs without a user session, so it uses the **service-role** Supabase client. Never grant entitlements from the client, from Checkout success redirects, or from optimistic UI — only from a signature-verified webhook event. (Voucher/comp grants are the only other writers, done server-side by trusted code.)

## Setup

- Add the SDK: `npm i stripe`.
- Env (server-only): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` (also required by the webhook; currently absent from `.env.local`).
- Both routes need `export const runtime = 'nodejs'`.
- Requires the `entitlements`/`products`/`product_items` schema — see the `supabase-migration` skill.

## Checkout session — `app/api/checkout/session/route.ts`

- **Auth required** (401 if anonymous). The user must be logged in **before** Checkout so `client_reference_id = user.id` is set on the session — no guest-checkout email-matching at launch. (Magic-link/OAuth account creation precedes this; see the `nextjs-supabase-feature` skill.)
- Look up the `products` row by slug (404 if missing/inactive).
- If the user already holds the entitlement, short-circuit `{ alreadyOwned: true }` (client routes to My Program) — don't create a duplicate session.
- Create a Checkout Session: `mode: 'payment'` (one-time) or `'subscription'` (membership); `line_items` from `products.stripe_price_id`; set `client_reference_id` and `metadata.product_id`; `success_url`/`cancel_url`; tax per the VAT decision (Stripe `automatic_tax` or a merchant-of-record).
- Return `{ url }`; the client does `window.location = url`.

Full code in `references/checkout-and-webhook.md`.

## Webhook — `app/api/stripe/webhook/route.ts`

Verify the signature with `STRIPE_WEBHOOK_SECRET` (read the **raw** body via `req.text()` — do not parse first), then handle:

| Event | Action |
|---|---|
| `checkout.session.completed` | upsert `entitlements` (`user_id=client_reference_id`, `product_id=metadata.product_id`, `source='stripe'`, `stripe_session_id=session.id`, `expires_at` = null for one-time / set for membership) on conflict `(user_id,product_id)` |
| `charge.refunded` (full) | revoke: delete the entitlement (or set `expires_at = now()`) for that `stripe_session_id` |
| `charge.dispute.created` | revoke + flag for ops |
| `customer.subscription.updated/deleted` (membership) | set/renew or lapse `entitlements.expires_at` from the subscription period |

**Idempotency:** events are delivered more than once — upsert on `(user_id, product_id)` and make revokes safe to repeat. A missed/late webhook means a buyer paid and can't watch → treat as **Sev-1**: log every grant/revoke with `stripe_session_id` and alert on signature failures.

## Testing

- Use Stripe **test mode** keys and test cards (`4242 4242 4242 4242` success; `4000 0000 0000 9995` declined).
- Forward events locally with the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (use the printed signing secret). The dev server may need `npm run dev:https` for some flows.
- Verify the §12 acceptance matrix in `CHALLENGE_PRODUCTIZATION_SPEC.md` (if present): purchase → one entitlement; duplicate event → no dup; refund → revoke; already-owned → no new session.

## Phasing

- **Phase 1:** one-time `payment` Checkout for the "21-Day Dance Challenge".
- **Phase 2:** `subscription` Checkout for membership (monthly + annual, push annual); drive `expires_at` from subscription events; handle dunning/cancel.
- **Phase 4:** Stripe **Connect (Express)** — connected accounts + automatic split at checkout (platform fee 40–60%); the entitlement grant is unchanged. Add only when instructor demand is proven.

## Additional resources

- **`references/checkout-and-webhook.md`** — full code for the checkout session route and the webhook (grant + refund/dispute revoke + subscription handling).
- Companion skills: `supabase-migration` (entitlements schema + `get_playable_uid`), `secure-playback` (what the entitlement unlocks).
