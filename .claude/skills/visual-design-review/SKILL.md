---
name: visual-design-review
description: This skill should be used when the user asks to evaluate or improve the VISUAL design — "how does it look", "make it look cooler/more premium/more modern", "review the design/typography/colors/spacing", "is this consistent", "catch inconsistencies", "does the font/color/layout work", "is this on-trend or dated", "polish the UI". Produces a prioritized, evidence-backed visual critique anchored to LeanSporty's design system, modern vs. elegant trend judgment, and pixel-level consistency. Complements ux-flow-review (flow/conversion) and code-review (bugs) — this skill asks "does it look right."
version: 0.1.0
---

# Visual design review for LeanSporty

Evaluate the **visual craft** of a page or component — typography, color, spacing/rhythm, components, imagery, motion, and overall taste — and produce prioritized, evidence-backed fixes. This is a *designer's eye*, not a generic "make it nice": every judgment is anchored to LeanSporty's design system, its audience, and a deliberate read of when to be **modern** vs **elegant**. It catches the smallest inconsistencies (a stray weight, a gray-800 next to a gray-900, a leftover ornament) that quietly make a product feel amateur.

## How to run it (always gather evidence first)

A visual review without looking at pixels is worthless. Do both:

1. **Render and look.** Drive the page in a real browser at **mobile (390px) and desktop (1280px)**, `deviceScaleFactor: 2`, and screenshot. Read the screenshots like a designer — squint, scan hierarchy, check alignment, spot anything that "feels off." Capture the hero/above-the-fold *and* full page. (Use the `/verify` approach: Playwright + system Chrome, headless.)
   - Note: middleware redirects logged-in users `/ → /activity`; auth-gated pages (`/workouts`, `/activity`, `/my-program`, `/settings`, `/instructor/*`) redirect anonymous → `/` or `/challenge`. Screenshot the right state (sign in, or note the redirect).
2. **Grep for drift.** The fastest way to catch inconsistency is to enumerate the actual classNames and look for variance. Run the drift scans in `references/heuristics.md` (font families/weights, text grays, radii, shadows, gradient usage, leftover decoration) and compare against the system in `references/design-system.md`. Variance = a finding.

Then reconcile what you *saw* against what the classes *say*, and against the system.

## The two questions every finding answers

1. **Is it consistent?** Does this element match the design system and the rest of the app? (typeface, weight, color token, radius, shadow, spacing, button style, brand wordmark). The bar is **zero unexplained variance** — `text-gray-800` where everything else is `text-gray-900` is a finding, even if "fine" in isolation.
2. **Is it good / on-brand / on-trend?** Does it serve the audience (women 30+, beginners, intimidation-averse, premium-but-warm) and land the intended register (see *modern vs elegant* below)? Is it current, or quietly dated (harsh drop shadows, pure-black on pure-white, emoji as decoration, blurry stock, tiny line-height, rainbow gradients)?

## Modern vs. elegant — pick the register on purpose

Both are "good"; the failure is being *neither* (generic template) or *mixing signals*. Decide per surface and keep it coherent.

- **Elegant / editorial** (LeanSporty's chosen direction): serif display (Playfair), generous whitespace, restraint, few elements, muted/refined palette, subtle motion, real photography. Reads premium, boutique, calm — fits a €49 wellness product for women 30+.
- **Modern / energetic**: bold geometric sans, tight big type, high-contrast color blocks/dark bands, motion-forward, full-bleed media. Reads app/startup, youthful, hype.

Rules of thumb: **premium price + calm audience → elegant. Speed/utility/young → modern.** Whichever you pick, commit fully — half-serif/half-bold, or elegant copy on a cluttered decorated background, is the tell of an unfinished design. The full cue lists are in `references/heuristics.md`.

## The lenses (what to inspect)

Apply all; details + "good vs failure" for each are in `references/heuristics.md`.

- **Typography** — one display + one body family; a real type scale; ≤2 weights per family; consistent heading treatment; line-height/measure; the logo wordmark matches the display face.
- **Color** — a disciplined palette (tokens, not ad-hoc shades); one accent system; consistent text grays; contrast/AA; gradient used intentionally (and the *same* gradient everywhere), not sprayed.
- **Spacing & layout** — consistent rhythm/scale, alignment, whitespace, max-width/measure, section cadence; no cramped or random gaps.
- **Components** — buttons (one set of variants, consistent radius/height/weight), cards, badges, inputs all from one system; consistent border-radius and shadow scale.
- **Imagery** — real, on-brand, consistent treatment; no app-store icons standing in for hero art on a web page; no placeholder where a real asset is implied.
- **Motion** — purposeful, subtle, consistent timing/easing; respects `prefers-reduced-motion`.
- **Decoration & polish** — no leftover ornaments (emoji ✦/✧, stray blobs), no dated effects; details (focus states, hover, empty states) finished.

## Output contract

Produce a prioritized findings list. For each: **Title · Severity · Where** (`route` / `file:line`) · **What's wrong** (cite the evidence — screenshot detail or the exact className variance) · **Fix** (concrete: the class/token to use) · **Effort**. Lead with a one-line **verdict** (register it's aiming for + whether it lands) and end with a **consistency scorecard** (typography / color / spacing / components / imagery / motion — ✅ / ⚠️ / ❌). Be specific and unflinching: "good enough" is not the bar; pixel-consistent and intentional is.

## Additional resources
- **`references/design-system.md`** — the current LeanSporty tokens & rules (Playfair display, Geist body, palette, button/radius/shadow conventions, the page-title rule). The source of truth to measure drift against; update it when the system changes.
- **`references/heuristics.md`** — per-lens "good vs failure" checklist, the modern/elegant cue lists, dated-pattern blacklist, severity rubric, and copy-paste **drift-detection greps**.
- Companion skills: `ux-flow-review` (flow/conversion), `code-review` (correctness), `verify` (run it).
