# LeanSporty flow maps — ideal click-counts & known friction

Five money/engagement flows. "Ideal" = the minimum user actions from intent to outcome. Compare any doc or implementation against these. Routes/components named where known from the audit; verify against the live tree.

---

## A. Cold buy (the money path) — highest priority
Intent: a cold visitor buys the challenge and starts watching.
Intended (CHALLENGE_PRODUCTIZATION_SPEC §4): `/challenge` → "Start the Challenge" → (anon) sign in/up → `POST /api/checkout/session` → Stripe Checkout → `success_url /my-program` → (webhook grants) → Day 1 plays.

**Ideal action count:** Start (1) → account via **magic link** (enter email + click email link) → pay (card + submit) → **land in My Program with Day 1 already surfaced** (0 extra) → play (1). Target: from "Start" to "playing", ≤ 4 deliberate actions.

**Known friction / must-checks:**
- 🔴 **OAuth-only blocks cold buyers** (no Apple/Google → no account). Fix: magic-link/email auth (E1.0). Until then this funnel is broken for a large share of cold traffic.
- 🟠 **Account-before-checkout adds a step.** Mitigate with magic link; do not force a social login. (Guest-checkout-by-email was deferred — note the tradeoff if revisiting.)
- 🔴 **Async entitlement grant.** The webhook writes the entitlement *after* redirect. The `/my-program?purchased=1` screen must show a "finalizing your access…" optimistic/poll state — never "you don't own this" to someone who just paid.
- 🟠 **Activation.** My Program must **auto-surface Day 1** (today's session), not present a bare grid the buyer must scan. The "aha" is playing, fast.
- 🟡 **Jargon.** No "tokens"/"entitlement" in any buyer-facing copy.
- 🟡 **Mobile.** The whole path must be thumb-friendly; Checkout on mobile; large CTAs.

---

## B. Try-before-buy (preview) — feeds A
Intent: a hesitant visitor tries Day 1 free, then upgrades.
Intended: `/challenge` → "Try Day 1 free" → free account → `/my-program` (Day 1 plays via signed token, Days 2–21 locked) → upsell CTA.

**Ideal:** Try (1) → account (magic link) → Day 1 auto-plays → persistent "Unlock the full challenge" CTA.

**Known friction / must-checks:**
- 🟠 **Anonymous can't play the signed preview** (auth required for a watermark identity). The landing must offer a **truly-public marketing trailer** for anonymous visitors; the full Day-1 preview sits behind a one-tap free account. Don't let "free" feel like a paywall.
- 🟠 Locked days (2–21) must read as "more goodness to unlock," not "you're blocked" — encouraging, not punishing (audience is intimidation-averse).
- 🟡 The upgrade CTA must be present on every preview screen, contextual, ≤1 click to Checkout.

---

## C. Live cohort join
Intent: an enrolled user joins the live class at start time.
Intended: discover (`/streams` or instructor profile) → enroll (must create a **paid entitlement / roster row**, not a free insert) → at start, join live watch.

**Ideal:** find (1) → enroll/pay (Checkout) → at start, **one obvious "Join live" click**.

**Known friction / must-checks:**
- 🔴 **Watch page redirects unauth/non-enrolled to `/`** (`app/streams/[id]/watch`) — a dead-end. Route denials to the cohort sales/enroll page (preserving intent), not home.
- 🟠 **Pre-live state:** before the instructor goes live, show a countdown + "You're in — starts in HH:MM," not an error or blank. Reduce anxiety.
- 🟠 **Enrollment is currently free & permissionless** (DEF-3) — the join flow must be re-pointed at entitlement, and the price/value must be clear before pay.
- 🟡 Live join should not require re-auth or hunting; surface it on the home/activity screen when a class is imminent.

---

## D. Activation & engagement — "My Program"
Intent: a buyer/member keeps coming back and completes the program.
Surface: `/my-program` (the 21-day grid; CHALLENGE_PRODUCTIZATION_SPEC §6.2).

**Engagement levers / must-checks:**
- 🟠 **Surface "today's session"** prominently above the grid — one tap to play. Don't make users scan 21 cells for Day N.
- 🟠 **Progress visible** (completed/15, "Day X of your challenge") — completion is the retention engine; show momentum.
- 🟠 **Six day-states must be visually unambiguous** (rest / available / completed / preview-free / locked / locked-until). Ambiguity = confusion = drop-off.
- 🟠 **"What's next" slot** for the end-of-program → membership upsell (flow E).
- 🟡 Accountability/warmth cues fit the audience: streaks, gentle nudges, "you've got this" — not aggressive gamification.
- 🟡 Empty/first-visit state should orient a brand-new buyer ("Start with Day 1").

---

## E. Membership upgrade (recurring revenue)
Intent: a finisher converts to recurring membership.
Intended: end-of-program/cohort → offer (in My Program + email) → `subscription` Checkout → access continues.

**Ideal:** see offer (surfaced, not hunted) → Subscribe (1) → Checkout → back to content, no interruption.

**Known friction / must-checks:**
- 🟠 **Timing:** present at the moment of accomplishment (program/cohort completion), where motivation peaks.
- 🟠 **Push annual** (cash-upfront + retention) without hiding monthly; make the annual value obvious, not a dark pattern.
- 🟡 One click from My Program to the membership offer; no separate "pricing page" maze.
- 🟡 Post-subscribe: confirm clearly what's now unlocked (library + included cohorts).

---

## Cross-flow dead-ends to always check
- Every CTA target route exists under `app/` (no `/tokens/buy`-class dead links).
- Every denial (401/403/not-enrolled/expired/lapsed-membership) routes to a **recovery** (sign-in preserving intent, paywall, or renew) — never a redirect to `/` or a blank screen.
- No deprecated "tokens" affordances remain in buyer-facing UI.
