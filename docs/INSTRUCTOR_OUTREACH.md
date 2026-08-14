# Instructor outreach playbook

Operator doc for recruiting the first ~5 instructors. The funnel this feeds:
**DM/email → `/teach` → application (both sides get email) → mint invite →
personal `/welcome/<code>` link → one-click activation → Studio onboarding →
first class → shared page.**

Companion docs: `INSTRUCTOR_INVITES.md` (minting codes), `INSTRUCTOR_PAYOUTS.md`
(monthly transfers), `INSTRUCTOR_PITCH.md` at the workspace root (copy source of
truth — every number in this playbook must match it).

---

## Who we're looking for (ICP)

From `BUSINESS_MODEL.md`: **2–3 instructors with real audiences** are the wedge.

- Women dance/fitness instructors teaching in person (dance fitness, Zumba-style,
  Latin, strong/sculpt hybrids) whose audience skews **women 30+**.
- **~5k–50k Instagram followers with real engagement** (comments from actual
  students, not bots). Engagement beats follower count every time.
- Poland/EU first (payouts in €, our language advantage, the Polish-language
  wedge from the business model).
- Already posts teaching clips — that means she has content, an audience that
  watches her teach, and probably recordings that could become a program on
  day one.
- Bonus signals: linktree with a booking page (she's already trying to monetize),
  "DM me for classes" in bio, complaints about Instagram reach.

**Skip:** mega-influencers (they want guarantees), instructors with no teaching
content (nothing to sell), anyone whose audience is mostly other instructors.
**Russia-based accounts** (a `.ru` site is the tell) — excluded on principle:
we may start working with Russian clients only after the war ends and Russia
has paid out all reparations to Ukraine. (Payment rails being unavailable is
incidental, not the reason.) Russian-*speaking* instructors elsewhere (Prague,
Warsaw diaspora) are fine — location, not language. Also skip anyone who already runs her own platform (an app, an
online school): our pitch is infrastructure, and she has it — "duct-tape
monetizers" (Google Forms, DM-me-to-book) are the ideal profile.

**Studios are NOT a skip (founder correction 2026-08-14).** The disqualifier is
a content-format test, not an org test: *can a member do the class at home?* A
dance-fitness / zumba / stretching / movement **studio with an audience is a
first-class lead** — it brings the distribution a solo instructor lacks and
already wants online revenue (VM Stretching, Rhytmio, the Cvičky Onlajn
competitor all prove Czech women pay for this). It onboards as one brand page
today; per-teacher sub-accounts are buildable if a studio signs and needs them
— but don't promise that in a cold DM, offer "we'll set that up for you" only
once she's interested. The only studios to skip are **equipment/venue-format**
ones whose classes need a machine/rig/pool: reformer-pilates, pole, aerial,
aqua. Gyms and gym *chains* are out for a practical reason (a facility brand
won't onboard on a new platform), not a purity one.

**Skip especially: dance as an art form rather than as fitness.** Ballroom and
partner-dance academies, children's and youth schools, competition/exam-track
technique, ballet, contemporary, street crews, wedding-first-dance coaching.
They are real dance teachers, but their students come to get *better at
dancing*; ours come to move, sweat and feel good. If her class needs a partner,
a studio floor or a syllabus, she is not a fit. The test: could a 38-year-old
with no dance background follow it in her living room and finish it feeling like
she worked out?

## Channels

**Instagram DM is primary** (it's where they live), **email second** (if the DM
sits unread and her email is public).

### Fix the empty account first

A DM from an empty brand account reads as spam. Before the first outreach
message, seed the LeanSporty Instagram (one afternoon, not a campaign):

1. ~9 posts so the grid looks alive. Use unused Anastasiia shots
   (`photos/PHOTOS.md` has the index — resize per its rules, never post an
   original) + 2–3 simple brand cards with the deal numbers ("Keep 80% of every
   sale after VAT", "€49 program → €33.86 to you") + 1 "how it works" carousel
   (teach → we run everything → paid monthly).
2. Bio: *"Teach dance & fitness online. Your page, your prices — you keep
   80–85% of every sale after VAT."* Link → `leansporty.com/teach`.
3. Follow every target before messaging her; like/comment something genuine a
   day or two before the DM (a real comment, not "🔥").
4. If the brand account still feels thin, DM from the founder's personal
   account and mention Lean Sporty — a person beats a logo anyway.

## The 3-touch sequence (English masters)

Send in whatever language you share with the instructor — **keep every number
identical to this doc**. Personalization slots: `{name}`, `{style}`,
`{specific_thing}` (one concrete video/post/detail of hers — the line that
proves you're not mass-DMing), `{invite_link}`.

**Touch 1 — the opener (DM)**

> Hi {name} — {specific_thing} is genuinely great. I run Lean Sporty, a small
> platform where dance & fitness instructors teach paid live classes and sell
> their own video programs from their own page. You set the prices and keep
> 80–85% of every sale after VAT — we run the website, payments, streaming,
> the sales tax, and support.
> If you're curious: leansporty.com/teach. Happy to answer anything right here.

**Touch 2 — the numbers (+3 days, only if no reply)**

> Quick follow-up with real numbers, then I'll stop 🙂 A €49 program pays you
> €33.86 as a featured instructor (85% after VAT — we handle the VAT for you).
> A €15 class seat pays €9.76. No monthly fee, no listing fee, no minimum fee —
> if nothing sells, you've spent time, never money. And every live class is recorded automatically, so one evening of
> teaching can become a program you sell forever. Would this fit how you teach?

**Touch 3 — the personal invite (+4 more days)**

> Last note from me, promise. I've saved you a featured spot — 85% of every
> sale after VAT, something we only offer our first instructors. Here's your personal
> invite: {invite_link} — it opens your Studio and takes about 10 minutes to
> set up your page. If now isn't the time, no problem at all — the door stays
> open.

Mint the invite (see below) **before** sending Touch 3, with ~30 days expiry.
If she replies at any touch, drop the sequence and just talk like a person.

## Approving an inbound application

Applications from `/teach` email the founder inbox automatically. To approve,
mint the invite (below) and send:

> **Subject: You're in — your Lean Sporty instructor invite**
>
> Hi {name} — thanks for applying. I read it personally, and I'd love to have
> you as a featured instructor: you keep 85% of every sale after VAT. Here's your
> personal invite: {invite_link}. It signs you in and opens your Studio —
> about 10 minutes to set up your page and schedule your first class. Any
> question, just reply — you're talking to the founder.

## Minting an invite

**Easiest: the Mint invite button on her card in `/admin/outreach`.** Same code
convention and 30-day expiry as the SQL below, and it links the code to her
prospect row so activation is attributed automatically.

Full detail in `INSTRUCTOR_INVITES.md`. By hand (Supabase SQL editor — make sure
you're on the **Lean Sporty** project):

```sql
insert into public.instructor_invites (code, email, invited_name, note, expires_at)
values (
  'ls-anna-' || encode(gen_random_bytes(4), 'hex'),
  'anna@example.com',
  'Anna',
  'Latin dance, ~8k IG — outreach T3 2026-07-26',
  now() + interval '30 days'
)
returning 'https://leansporty.com/welcome/' || code as invite_link;
```

Send the returned link. After she redeems a **featured** invite, set her split
once (`update public.instructors … set split_pct = 85` — exact SQL in
`INSTRUCTOR_INVITES.md`).

## Objections → answers (keyed to the /teach FAQ)

Use these in DMs; the page answers must never contradict them.

| She says | You answer |
|---|---|
| "I already go live on Instagram for free" | Keep doing that — IG is your reach. Lean Sporty is where the *paid* version lives: your lives here are recorded automatically and can be resold as programs. Instagram pays you nothing per viewer. |
| "I'm not technical / no time for setup" | There's nothing to set up. You go live from your browser, your page is built for you, and setup is about 10 minutes, once. |
| "What's the catch? Why only 20%?" | The recordings. Your recorded classes join our members' library and grow the platform — that's why we can charge 20% instead of the 30–50% others take. (FAQ: "Why do you keep the recordings?") |
| "Could I end up losing money?" | No. No monthly fee, no listing fee — your share is a percentage of sales, so you're always positive. Worst case you've spent time. (FAQ #1) |
| "I don't want to handle refunds/support" | You don't. Failed cards, refunds, "I can't log in" — our job. (FAQ #2) |
| "My audience pays in złoty" | You set one price in euros; students pay by card anywhere and their bank converts. (FAQ #3) |
| "When do I actually see the money?" | Every sale shows in your dashboard immediately; we pay your share once a month — automatically via Stripe, or by bank transfer (balances under €20 roll to the next month). (FAQ #7) |
| "Why should I trust a new platform?" | Fair. That's why the first instructors are featured: 85%, direct line to the founder, and you shape the product. We need your classes more than a fee. |

## Claims discipline

**Allowed** (all true in the product today): 80% standard / 85% featured split,
**always stated as "of every sale after VAT"** (we're the merchant of record and
remit VAT; the split applies to the price net of VAT) · no minimum fee — paid
class prices simply start at €5 (below that, make it free) and programs at €19 · €15 seat → €9.76, €49
program → €31.87 (€33.86 featured) · **paid monthly — automatically via Stripe,
or by bank transfer** (Stripe Connect onboarding is built; balances under €20
roll over) · no monthly fee, no listing fee ·
automatic recording of live classes · watermarked, protected, non-downloadable
playback · storefront/checkout/receipts/reviews run for you · ~10-minute
profile setup.

**Forbidden** (not built — one skeptical prospect checking = credibility gone):
payout timing other than monthly · notifications to her followers when she goes
live · any audience-size or earnings promise from our side · membership
revenue · "apps" (web only today).

If a claim isn't in the allowed list, it doesn't go in a DM until it ships.

## Tracking

**`/admin/outreach`** is the list (founder-only, works on a phone). It replaced
the spreadsheet this doc used to recommend, because the spreadsheet never got
written and the same accounts kept resurfacing.

- **Add handles** — paste anything (`@name`, bare names, share-sheet URLs, all
  mixed) and it tells you immediately what's new, what you already had, and who
  already applied through `/teach`. Handles are deduplicated on a unique index,
  so finding the same instructor twice is a no-op.
- **Queue** — who's due today, best ICP fit first. Fill in `{specific_thing}`,
  copy the touch, send it by hand, mark it sent. Touch 2 schedules +3 days,
  Touch 3 +4 more, exactly as above.
- **Mint invite** — replaces the SQL below and links the code to her row, so
  redeeming it flips her to `activated` automatically.
- **Cities** — the seeded territory queue, so sweeps are systematic rather than
  random. Filling the list is `OUTREACH_SWEEPS.md`.

Nothing sends automatically, and it never will: Meta blocks business-initiated
DMs outside a 24-hour reply window and prohibits cold outreach. The tool does
everything around the send.

The activation side is still queryable: `select code, invited_name, used_at from
public.instructor_invites order by created_at desc;`
