# Visual critique — heuristics, cue lists, severity, drift greps

## Per-lens: good vs failure

**Typography**
- Good: 1 display + 1 body family; clear scale (e.g. 5xl/4xl/3xl/xl/base/sm); ≤2 weights per family; every page title the same treatment; line-height ~1.05–1.15 on display, ~1.5 on body; measure ≤ ~70ch.
- Failure: 3+ weights doing similar jobs; logo in a different face than headings; mixed page-title styles across routes; serif at a weight the font renders poorly; italic used where the face's italic is mannered; all-caps with no letter-spacing; cramped line-height on large type.

**Color**
- Good: a small named palette; one accent system used intentionally; consistent text-gray ramp; one canonical gradient; AA contrast.
- Failure: ad-hoc shades (`pink-400` here, `pink-500` there for the same role); gradient sprayed on text that should be neutral; `gray-800` vs `gray-900` mixed on equivalent elements; low-contrast gray-on-pink; pure black on pure white.

**Spacing & layout**
- Good: a consistent spacing scale; aligned edges; intentional section rhythm; one max-width for reading; breathing room around focal elements.
- Failure: random gaps (`gap-3` next to `gap-8` for the same relationship); misaligned columns; cramped hero; inconsistent section padding; content full-width with no measure.

**Components**
- Good: one button system (variants, one radius, one height, one weight); consistent card radius/shadow/border; inputs match.
- Failure: buttons varying radius/weight/label-style across surfaces; multiple card shadow styles; hand-rolled primitives next to shadcn ones; inconsistent hover/focus.

**Imagery**
- Good: real, on-brand, consistent crop/treatment/overlay; owns the hero.
- Failure: app-store icon as hero art on web; placeholder where a real asset is implied; inconsistent aspect ratios/overlays; low-res or off-tone stock.

**Motion**
- Good: one entrance pattern, subtle, consistent easing/timing; reduced-motion respected.
- Failure: pulsing/animate-everything; inconsistent durations; motion that fights reading; no reduced-motion guard.

**Decoration & polish**
- Good: whitespace is the decoration; finished states (hover, focus-visible, empty, loading).
- Failure: emoji/ornament clutter, leftover decoration from a prior style, missing focus rings, unstyled empty/error states.

## Modern vs elegant — cue lists

**Elegant / editorial (LeanSporty):** serif display; lots of whitespace; restraint (few elements); muted/refined palette + one accent; thin/light weights; subtle motion; real photography; centered or asymmetric editorial layout. Avoid: clutter, heavy shadows, neon, busy gradients.

**Modern / energetic:** bold geometric sans (tight, big); high-contrast color blocks; dark feature bands; full-bleed video; motion-forward; chunky rounded UI; duotone imagery. Avoid: timidity, decorative serifs, pastel-only.

**Coherence test:** if a page mixes signals from both columns (elegant serif headline on a cluttered, heavily-decorated, harsh-shadow background) it reads unfinished. Pick one and commit.

## Dated-pattern blacklist (flag on sight)
- Emoji used as decoration (✦/✧/sparkle spans).
- Pure `#000`/`#fff` with harsh gray box-shadows.
- Rainbow or 3+ stop gradients; gradient text everywhere.
- Tiny line-height on big headings; centered walls of text with no measure.
- Stocky/blurry imagery; app-icon as hero.
- `animate-pulse` blobs as ambient decoration.
- Inconsistent radii (sharp + pill + soft mixed without intent).

## Severity rubric
- **Critical** — breaks brand/perception at first glance or on the money path (wrong identity, illegible contrast, broken layout, app-icon hero on the buy funnel).
- **High** — clear inconsistency a visitor notices (page titles in different typefaces, mismatched logo, two button styles).
- **Medium** — noticeable on inspection (gray-800 vs 900 drift, gap inconsistency, thin/odd social proof, dated shadow).
- **Low** — pixel nitpicks (a single stray weight, minor easing mismatch).

## Drift-detection greps (run from `leansporty.com/`)

```bash
# Heading typeface consistency — every page title should use font-display
grep -rn '<h1' app components --include="*.tsx"
grep -rln 'font-display' app components --include="*.tsx"

# Gradient usage — should only be buttons, logo "Sporty", and marketing accents
grep -rn 'from-pink-500 to-rose-400' app components --include="*.tsx" | grep -iE '<h1|<h2'

# Text-gray ramp drift (gray-800 mixed into heading roles)
grep -rno 'text-gray-[0-9]00' app components --include="*.tsx" | sort | uniq -c | sort -rn

# Weight variety (want light + semibold; flag font-medium/font-bold)
grep -rno 'font-\(light\|normal\|medium\|semibold\|bold\)' app components --include="*.tsx" | sort | uniq -c | sort -rn

# Radius + shadow scale drift
grep -rno 'rounded-[a-z0-9]*' app components --include="*.tsx" | sort | uniq -c | sort -rn
grep -rno 'shadow-[a-z0-9/]*' app components --include="*.tsx" | sort | uniq -c | sort -rn

# Leftover decoration
grep -rn '✦\|✧\|animate-pulse' app components --include="*.tsx"

# Brand wordmark consistency (should be "Lean Sporty", two words)
grep -rn 'LeanSporty' app components --include="*.tsx" | grep -v 'LeanSportyLogo\|lean-sporty-logo\|import'
```
Each line of unexpected variance in the counts above is a candidate finding — investigate, then report with the exact `file:line`.
