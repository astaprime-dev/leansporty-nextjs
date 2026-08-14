# Outreach sweeps — filling the prospect list

Three free lanes feed `/admin/outreach`. All of them end at the same endpoint,
so a handle found twice is a no-op, never a duplicate row.

Companion docs: `INSTRUCTOR_OUTREACH.md` (the ICP, the 3-touch sequence, claims
discipline), `INSTRUCTOR_INVITES.md` (invite codes — now minted from the panel).

---

## Ground rules

- **Never automate sending.** Meta's Messaging API only allows business-initiated
  DMs inside a 24-hour reply window and explicitly prohibits cold outreach;
  unofficial DM tools are the fastest route to a flagged account. The panel
  fills in the message, you tap send. @leansporty is the asset — protect it.
- **Browsing is read-only and human-paced.** A sweep reads handles off pages you
  could scroll yourself. Don't mass-follow, don't mass-like, and keep a session
  to a few hundred profiles.
- Everything below writes through `POST /api/admin/outreach/import`, which
  normalizes handles, dedupes on them, and skips anyone who already applied
  through `/teach` or already teaches here.

---

## Lane 1 — Browser-assisted sweep (highest yield)

Runs in your own logged-in Chrome, because Instagram needs a session. Claude
drives the tab, reads the handles off the rendered page, and posts them.

**Best surfaces, in order:**

1. **"Suggested for you" on an instructor you already like.** Instagram's own
   similarity graph, and it is far better at finding *more instructors like her*
   than any hashtag. Open a qualified prospect's profile, expand suggestions,
   sweep. This is the single highest-yield surface in the system.
2. **A city hashtag** — `instagram.com/explore/tags/<tag>/`. The seeded tags per
   city are on the Cities tab; they're localized on purpose (`#bachatawarszawa`,
   not `#bachata`), because English-only tags miss most local instructors.
3. **Followers of a studio account** found by Lane 2.

**The ask:** *"Sweep #bachatawarszawa for me"* — Claude opens the tag, collects
handles from the grid, and imports them tagged with that hashtag so you can see
later which tags actually produce instructors.

**What it runs on the page** (handles only — no scraping of posts or personal
data beyond the public handle):

```js
Array.from(document.querySelectorAll('a[href^="/"]'))
  .map((a) => a.getAttribute("href"))
  .map((h) => h.split("/").filter(Boolean))
  .filter((parts) => parts.length === 1)
  .map((parts) => parts[0])
  .filter((h, i, all) => all.indexOf(h) === i);
```

**The import** (from the machine, using `CRON_SECRET` — the panel's paste box
uses your session instead):

```bash
curl -sS https://leansporty.com/api/admin/outreach/import \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"hashtag","sourceDetail":"#bachatawarszawa","prospects":[{"handle":"anna.dance"}]}'
```

Handles collected this way carry no bio, so the scorer can't judge them — they
sit in **New** for a quick human glance. To get them scored automatically,
collect the bio too (open the profile) or let Lane 2 find them with one.

---

## Lane 2 — Google Places, city by city

The structured lane. For each seeded city, Places (New) Text Search returns the
studios; each studio's website usually lists the Instagram handles of the studio
*and* the people who teach there — instructors who never show up under a
hashtag.

The four seeded queries per city target the **class format**, not the art form:
`dance fitness classes`, `zumba class`, `pilates studio`, `fitness classes for
women`. An earlier version searched `dance studio in <city>` and the first live
Warsaw sweep came back full of ballroom academies, a children's school and
exam-track technique studios — all real dance studios, none of them the ICP.
Don't reintroduce "dance studio".

Expect roughly a fifth of what lands to still be off-target (a gym chain, a
ballroom school Google matched anyway, a web agency whose handle sits in a site
footer). That's what the scorer is for — it reads each bio and rejects them.

Run it from the **Cities** tab → **Sweep studios**, or:

```bash
curl -sS https://leansporty.com/api/admin/outreach/sweep/places \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"territoryId":"<uuid>","queryIndex":0}'
```

One query per call (a city seeds three) and 18 studio sites per call, so a run
fits inside the 60-second function limit. The response carries `nextQueryIndex`
— the panel walks it — and `sitesSkipped`, so a big city reports what it didn't
reach rather than pretending it was covered.

**Setup, once:** `GOOGLE_API_KEY` already exists (the Drive importer uses it),
but **Places API (New) must be enabled for that key** in Google Cloud. Free tier
is 5,000 Text Search Pro calls a month and a city costs 1–3, so hundreds of
cities fit inside free. Don't add `rating` or `reviews` to the field mask — that
moves the call to a paid SKU for data we don't use.

---

## Lane 3 — Google search operators

Cheap breadth, noisier results. Each city seeds two queries using the local word
for "instructor", because `instructor` alone finds nothing in Warsaw:

```
site:instagram.com "Warsaw" (instruktorka OR trenerka OR zajecia)
site:instagram.com "Warsaw" (bachata OR salsa OR zumba OR pilates)
```

Copy one from the Cities tab, run it in a normal browser tab (through a country
VPN if you want truly local rankings — Google localizes by IP), then click the
**collector bookmarklet** on the results page: every profile handle on the page
lands on your clipboard, ready for the **Add handles** box. Install and details:
`OUTREACH_BOOKMARKLET.md`. It works the same on Instagram surfaces (suggested
for you, tagged pages, hashtag grids) and studio websites.

---

## Lane 4 — Google-index sweep (Lane 3, automated — no AI)

**Cities tab → Sweep Google.** Runs the city's operator queries (the two seeded
ones plus the templates in `lib/outreach-google-index.ts`) through the official
Custom Search API and reads what Google already knows about each profile: the
result title carries name and handle, the page metadata carries the follower
count ("12K Followers, …"). Instagram itself is never contacted — no login
wall, no session, no account risk.

Judgment is deliberately split: **keyword rules do the negative work** (studio /
szkoła / ballroom / pole / kids names, out-of-band follower counts — every
verdict names the rule that fired, and auto-rejected rows are kept so they never
resurface), **you do the positive work** — survivors land in **New**, scored 70
(5k–50k) or 55 (edge of band) for sort order, at ten seconds a card. Rules only
read the account's *name*; a woman who merely mentions her studio in her bio is
never auto-rejected. Tune the keyword lists at the top of
`lib/outreach-google-index.ts`.

**Setup, once (~2 min):** sign up at **serper.dev**, put the key in
`SERPER_API_KEY`. 2,500 free queries ≈ 250 full city sweeps, then ~$1 per
1,000 (a city ≈ 5 queries ≈ $0.01). **Do not** attempt Google's own Custom
Search JSON API — it was closed to new customers (verified 2026-08-05, hard
403 regardless of setup; full shutdown 2027-01-01).

```bash
curl -sS https://leansporty.com/api/admin/outreach/sweep/google-index \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"territoryId":"<uuid>","queryIndex":0}'
```

One query per call; the response carries `nextQueryIndex` and the panel walks
it, reporting "N new — X to review, Y auto-filtered".

---

## Lane 5 — Claude drives the browser (no bookmarklet, no pasting)

When Claude is in the session with the Chrome tools, it can run the *whole*
loop itself — search, extract handles, verify each profile, import — with you
just watching. This is how the 7-city Czech sweep (2026-08-14 → 37 verified
leads) was done. Google only (Bing ignores `site:instagram.com`); watch for a
bot-check on rapid automated searches. Full method + a copy-paste prompt:
`OUTREACH_CLAUDE_SWEEP.md`. Trigger: *"Sweep <city> for instructors (Lane 5)."*

## The two-hop city recipe (proven on Praha, 2026-08-08)

Directories find **venues**; venues' tags and followers find **people**;
verification turns handles into decisions. Praha's numbers: 91 from Places →
44 auto-rejected by keyword rules → 43 more rejected on profile verification
(each with a written reason) → 0 direct people, but **3 doorways** → mining
their Tagged pages / Trainers highlights / opened posts → 14 handles → verified
→ **6 real instructors in Review**.

1. Add the city (Find tab) → **Sweep studios**.
2. Triage: keyword rules auto-file the obvious venues; verify the survivors by
   opening their profiles (or ask Claude to run both passes). Expect ~0–5
   direct people — the real prize is a shortlist of 2–4 **doorways**: the
   city's biggest active studios, local class-program brands, schools that
   name their instructors.
3. In your logged-in Instagram, mine each doorway — surfaces ranked by signal
   (measured on Praha): **Tagged page** (post URLs carry the authors — the
   women who physically attend; 14 collected → 6 instructors) > team/trainer
   story highlights > opened posts (author + tagged + commenters) ≫
   **Followers list** (mostly global follow-back noise on a big account; 140
   sampled → 1 find — sample it, never grind it). Collect with the
   bookmarklet, paste with the City set.
   **A studio's FOLLOWING list beats its followers for finding instructors.**
   A studio follows a small curated set (MOVE Studio Prague, 10.1K, follows
   only 26) = its own instructors + partners. Mining that following gave 3
   real Prague instructors from 10 (incl. the studio's co-founder = the
   partnership contact), vs followers ~1-in-140. Followers are students; a
   studio's *following* is its staff. Also: the followers modal throttles
   automated scroll badly; a 26-item following loads in full. So for a studio
   doorway, order is: **Following list > Tagged page > Followers.**
   **Beware doorway bias:** one doorway = one community. Praha's deepest-mined
   doorway was a Russian-speaking studio, so the first harvest looked all-expat
   until the Czech doorways were worked too. Mine at least two culturally
   different doorways per city before concluding anything about the market.
   And chase **names, not just handles**: venue posts constantly name their
   instructors in captions ("Zumba s Deni", "Instruktorský tým VENDULA…") —
   google `"Full Name" zumba <city>` and her Instagram or website surfaces.
   That name-chase found the first in-band Czech local (22.4K) after every
   handle-based lane had missed her.
4. Verify the haul the same way. Survivors land in Review, scored, with the
   reason on the card.

## After a sweep

1. **New** tab → **Score next batch**. Claude reads each bio against the ICP,
   qualifies or rejects, and writes a one-line reason. Rejected rows stay in the
   table so the same account never resurfaces from another lane.
2. **Queue** shows what's due, best fit first. Fill in the one specific thing you
   liked about her, copy Touch 1, send it, mark it sent. Touch 2 lands in 3 days,
   Touch 3 four days after that.
3. Before Touch 3, **Mint invite** — that's the link that closes the loop: when
   she redeems it, her prospect row flips to `activated` on its own.

A daily cron (`/api/cron/outreach-due`, 07:00) emails you when something is due,
and stays quiet when nothing is — so the queue doesn't rot unopened. It needs
`FOUNDER_NOTIFY_EMAIL` (or falls back to `EMAIL_REPLY_TO`).

The **Applied** tab shows `/teach` applications alongside the outbound queue —
one click adds an applicant to the list, and anyone who already applied is
skipped automatically by every import lane, so she can never get a cold opener.
