# LeanSporty design system (source of truth — measure drift against this)

Direction chosen 2026-06-28: **elegant / premium-editorial**. Audience: women 30+, beginners/returners, intimidation-averse; product is a €49 wellness program. Keep it calm, warm, premium, restrained.

> **For every NEW page/component, follow the "Alignment checklist" at the bottom.** Reach for the shared primitives first; never hand-roll a banner, empty state, pill button, or status chip.

## Typography
- **Display / headings + logo:** **Playfair Display** (serif), via `next/font` → CSS var `--font-display`, applied with the **`.font-display`** utility. Serif headings use `font-light`.
- **Body / UI:** **Geist** (sans). Body text `font-light`; buttons/UI/active-nav `font-semibold`.
- **Weights:** keep the scale to **`font-light` + `font-semibold` only**. Never `font-medium` / `font-bold` in a heading.
- **No emoji** in headings (no 🌐/🕒/✦). Heading color is `text-gray-900` — except white-on-dark/gradient cards, or status-colored (red/amber) error/warning headings.

### Canonical heading classes (one per role — match exactly)
| Role | Class |
|---|---|
| **Page title (h1)** | `font-display text-3xl sm:text-4xl font-light text-gray-900` — **no gradient** |
| **Marketing hero title** (home/challenge only) | bespoke big serif (`text-5xl/7xl` home, `text-4xl sm:text-6xl` challenge), plain `text-gray-900` + **one accent word** gradiented (see Color) |
| **Section heading — sans (h2)** | `text-2xl font-semibold text-gray-900` |
| **Section heading — marketing serif (h2)** | `font-display text-3xl font-light text-gray-900` |
| **Card / sub-heading (h3)** | `text-lg font-semibold text-gray-900` |
| **Empty / ended-state title** | `text-lg font-semibold text-gray-900` (use `EmptyState`) |
| **Stat-card label** | `text-sm font-semibold text-gray-600` |
| **Dialog / sheet title** | `text-2xl font-semibold text-gray-900` — no gradient |

## Color
- **Brand accent:** pink→rose gradient, exactly `bg-gradient-to-r from-pink-500 to-rose-400`. Allowed only on: primary buttons (`Button variant="brand"`), the **"Sporty"** in the logo, and **one accent WORD** in a **marketing hero title** (home hero "Fitness"; challenge hero "Dance" via the `accentTitle` helper in `app/challenge/page.tsx`). **Never** a full-title gradient, never on interior/app page titles or dialog titles, never sprinkled.
- **Text:** primary `text-gray-900`; secondary `text-gray-600` / `text-muted-foreground`; tertiary `text-gray-400/500`. Don't put `text-gray-800/700` on headings that should be `gray-900`.
- **Surfaces:** white/blush cards (`rose-50`/`pink-50/*`); card borders **`border-pink-100`** (hover `border-pink-300`) — **not** `border-gray-200`.
- Keep contrast AA; avoid pure `#000` on `#fff`.

## Components — use the shared primitives (don't hand-roll)
- **`@/components/ui/alert`** — `<Alert variant="info|success|warning|error">` for every notice/banner. One look: `rounded-2xl border p-4`, icon + color per variant (info=pink, success=green, warning=amber, error=red). `hideIcon` to keep a custom icon (e.g. spinner). Off-palette colors (blue/purple/cyan/rose) map to the nearest variant — never add new banner colors.
- **`@/components/empty-state`** — `<EmptyState title description action>` for every "No … yet" state. Soft-pink `rounded-2xl` card; CTA via `action`.
- **`@/components/ui/button`** — primary CTA `variant="brand"` (gradient pill), secondary `variant="brandOutline"`, `size="pill"` for large. Links: `<Button asChild variant="brand"><Link/></Button>`. Buttons are `font-semibold` — never `font-light` on a CTA.
- **`@/components/ui/badge`** — status chips `variant="brand|free|live|lock"`.
- **Radius:** cards `rounded-2xl`; banners/EmptyState `rounded-2xl`; pills/buttons/chips `rounded-full`; inputs/small `rounded-lg`. No new radii.
- **Shadow:** soft, tinted — `shadow-sm` / `shadow-lg hover:shadow-pink-200/50`. No harsh gray drop shadows.
- Progress-bar fills legitimately use the raw gradient (they're not buttons).

## Motion
- `.animate-fade-up` for gentle entrance; subtle, ~0.7s, eased; gated by `prefers-reduced-motion`.

## Decoration
- **None.** No emoji ornaments, no blob clusters, no dot patterns. One faint warm glow max per hero. Whitespace is the decoration.

## Decision log
- **2026-06-28** — chose elegant/premium-editorial; Playfair Display; standardized "Lean Sporty" (two words).
- **2026-06-29** — shared primitives (Alert/EmptyState/Button brand/Badge) built + rolled out app-wide (commit `55ab075`); heading hierarchy normalized to the table above (`4b234b3`); accent-word gradient settled — full-title gradient banned, marketing heroes accent ONE word (`ba63539`).

## Known open visual debt (flag if relevant, don't re-discover)
- **`stream-card` price chips still say "tokens"** — awaiting the tokens→currency product decision (live cohorts aren't a paid product yet); not a styling fix.
- **Thin social proof** on `/challenge` ("5.0 from 2 reviews" from live classes, not challenge-specific).
- No real lifestyle photography yet; no deep accent/cream secondary palette (pink-on-white only).
- `components/hero.tsx` is dead Next/Supabase starter boilerplate (not imported) — delete on a cleanup pass.

## Alignment checklist (run for every new page/component)
1. **Page title** = the canonical h1 class. Interior pages: plain `text-gray-900`, no gradient.
2. **Section/card headings** = the canonical h2/h3 classes; weights only light/semibold; color `gray-900`.
3. **Notices** → `<Alert>`; **empty states** → `<EmptyState>`; **CTAs** → `<Button variant="brand">`; **status chips** → `<Badge>`. No hand-rolled equivalents.
4. **Card borders** `border-pink-100`, radius `rounded-2xl`.
5. **Gradient** only on brand buttons, logo "Sporty", and (marketing heroes only) one accent word.
6. **No emoji** in headings; no decorative ornaments.
