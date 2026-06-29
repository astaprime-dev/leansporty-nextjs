---
name: ux-flow-review
description: This skill should be used when the user asks to review or improve user experience and flow — "review the UX", "audit the user flow", "reduce the number of clicks", "minimize friction/confusion", "improve conversion", "maximize engagement", "check the funnel", "is this flow confusing", "where do users drop off" — or to evaluate a flow either as described in the requirements docs or as built in the code. Produces prioritized, evidence-backed flow fixes anchored to LeanSporty's funnels and audience.
version: 0.1.0
---

# UX & conversion-flow review for LeanSporty

Evaluate a user flow for **friction, confusion, click-count, and engagement/conversion** — against the *documented intent*, the *built implementation*, or both — and produce prioritized, evidence-backed fixes. This is not a generic "make it nice" pass: every judgment is anchored to LeanSporty's audience, its money funnels, and its North-Star metrics. It complements `/code-review` (bugs) and `/verify` (does it run) — this skill asks "is the flow good and does it convert."

## Anchor every judgment to these (this is what makes findings sharp)

**Audience — women 30+, beginners/returners** who find gyms and hardcore fitness apps intimidating or boring, and want fun, low-pressure movement at home.
- Tone must be warm, encouraging, confidence-building. **No jargon** (never surface "tokens", "entitlements", "WHEP", "UID"). **Mobile-first** (assume phone). Reduce intimidation: no "advanced/beginner" gatekeeping cues, no overwhelming choice.

**The money is in the funnel.** Friction in these specific paths costs revenue or retention — score findings by which one they hurt:
1. **Cold buy** — Landing → (account) → Checkout → entitlement → **Day 1 plays** → completion → membership.
2. **Try-before-buy** — Landing → free account → Day 1 preview → upgrade.
3. **Live cohort join** — discover → enroll (paid) → join live at start.
4. **Activation & engagement** — "My Program": get to *today's session* fast; show progress; "what's next".
5. **Membership upgrade** — end-of-program/cohort → subscribe (push annual).

Concrete maps with ideal click-counts and known friction are in `references/funnels.md`.

**North-Star (severity = impact on these):** blended LTV:CAC ≥ 3 · CAC payback < 1 month · membership month-3 retention ≥ target · ≥ €10k MRR · ≥ 2 channels. **Activation (reaching Day 1) and membership retention are the highest-leverage moments.**

**Friction already found in the audit — start from these, don't rediscover them:**
- **OAuth-only auth** (no email/password) blocks cold buyers without Apple/Google → magic-link is the fix.
- **`/tokens/buy` is a dead link**; "tokens" vocabulary leaks into the buy flow (deprecated model).
- **The watch page redirects unauth/non-enrolled users to `/`** — a dead-end; denials must route to recovery (sign-in preserving intent, or the paywall/enroll page), never a black hole.
- **Entitlement is granted async by the Stripe webhook** → the post-checkout screen must not tell a paying buyer "you don't own this" for a few seconds (optimistic/poll/“finalizing…”).

## Two modes

### Doc-mode (cheapest — review before building)
Take a flow described in the requirements (`WEB_PRODUCT_REQUIREMENTS.md`, `CHALLENGE_PRODUCTIZATION_SPEC.md` if present, or `references/funnels.md`). Walk it step by step, **count user actions**, and flag dead-ends, decision points, confusing labels, missing states, and tone misfits for the audience — at the spec stage, where a fix is one edit.

### Implementation-mode (trace what's actually built)
Reconstruct the real flow through the Next.js App Router and count real clicks/navigations:
1. **Entry:** find the route/page that starts the flow under `app/`.
2. **Gating & redirects:** grep for `redirect(`, `auth.getUser`, `notFound(` in the page/layout — each forced redirect is a potential dead-end or detour.
3. **Actions:** follow CTAs — `href`, `router.push`, `<form action>`, server actions in `app/actions.ts`, and `fetch('/api/...')` calls — to the next step.
4. **States:** confirm each step renders loading / empty / error / **denied (403/not-entitled)** states; a missing denied-state is a dead-end.
5. **Dead links:** verify every CTA target route actually exists under `app/` (the `/tokens/buy` class of bug).
6. **Count:** tally clicks/navigations from intent → outcome; compare to the ideal in `references/funnels.md`.

### Reconcile
Compare built vs intended: where did extra steps, confusion, or dead-ends creep in relative to the spec? Flag drift in both directions (spec friction not yet built; build friction not in the spec).

## Evaluation lens

Apply the checklist in `references/heuristics.md`. The core questions:
- **Click/step economy** — is the action count at the minimum? Can a step be removed, deferred, or defaulted?
- **One primary action per screen** — is the next step unmistakable? Decision overload?
- **No dead-ends / no dead links** — every CTA goes somewhere real; every denial recovers.
- **Activation speed** — how fast from purchase → playing Day 1? Minimize ruthlessly.
- **Engagement loops** — progress visible, "today/next" surfaced, upsell slot, accountability cues (fit the challenge/cohort model).
- **Trust & tone** — honest outcomes + disclaimers, social proof placed at the decision, warmth, mobile.
- **Auth friction** — lowest-friction account creation (magic link); never force a social account.

## Output contract

Produce a prioritized findings list. For each finding:
- **Title** · **Severity** (Critical/High/Med/Low by funnel-metric impact) · **Where** (doc § or `route` / `file:line`) · **Friction** (e.g. "+1 click", "dead-end", "confusing label", "jargon") · **Impact** (which funnel/metric) · **Fix** (concrete) · **Effort**.
- Include a **"clicks to key outcome"** table (current → proposed) for the reviewed flow.
- When asked, append confirmed items to the requirements doc as **`UX-FR-`** requirements so they enter the build backlog.

Use the template in `references/heuristics.md`.

## How to run it well
- **Scope to one flow at a time** (buy, taster, cohort-join, activation, membership) — don't boil the ocean.
- Prefer doc-mode before a flow is built; implementation-mode after; reconcile when both exist.
- For a broad sweep, dispatch parallel readers (one per flow) and merge findings.
- Confirm dynamic behavior with `/verify` (run the app) and pair with `/code-review` for correctness — keep this skill focused on flow quality.

## Additional resources
- **`references/funnels.md`** — the five flows mapped with ideal click-counts, the screens/routes involved, and known friction per step.
- **`references/heuristics.md`** — the full evaluation checklist, the severity rubric, and the findings-report template.
