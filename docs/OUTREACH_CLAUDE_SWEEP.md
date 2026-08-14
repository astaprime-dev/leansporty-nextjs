# Lane 5 — Claude drives the browser (the no-bookmarklet sweep)

The bookmarklet lanes need a human: you run the search, click the collector,
paste. This lane removes that — **Claude drives your logged-in Chrome end to
end**: search → extract handles → verify each profile → import to
`/admin/outreach`. You just watch. This is how the 7-city Czech sweep on
2026-08-14 was done (Praha/Brno/Ostrava/Plzeň/Olomouc/Liberec/Hradec → 37
verified leads).

## What it needs

- Claude has the **Claude-in-Chrome** browser tools available this session.
- Your **Chrome is open and logged into Instagram** (Claude reuses your
  session for the profile checks — same as the bookmarklet lanes).
- Nothing else. No API key, no bookmarklet, no pasting.

## How it works (the loop, per city)

1. **Search — Google only.** Claude navigates to
   `google.com/search?q=site:instagram.com "City" (zumba OR pilates OR barre OR
   tanec OR fitness) lektorka OR instruktorka`.
   **Bing does not work** — it ignores `site:instagram.com` and returns the
   city portal + Wikipedia. Verified twice. Use Google.
2. **Extract.** Claude runs a scrape on the results page (same logic as the
   bookmarklet, run via the page console): pulls handles from `(@handle)` in
   titles, the "Instagram · handle" source line, and `instagram.com/<handle>`
   anywhere in the page text or links. ~8–12 handles per page-1.
3. **Verify.** Claude opens each plausible profile and reads the bio: is it a
   person or a *dance-fitness/movement studio* (both are leads — see the ICP in
   `INSTRUCTOR_OUTREACH.md`), is it in-band, is the content at-home-doable?
   Rejects gyms/facilities, reformer/pole/aerial, competition troupes, retail.
4. **Import.** Verdicts (with follower count, discipline, score, reason) go
   straight into `outreach_prospects` with the city's territory attached.
   Keepers land in Review; rejects are filed with a written reason so they
   never resurface.

## Caveats (why the bookmarklet still exists)

- **Google bot-check risk.** Rapid *automated* Google searches can trip
  "unusual traffic" / a CAPTCHA — on **your** account/IP. It didn't happen in
  the 2026-08-14 run, but it can. If it does, Claude stops and you finish that
  city with the bookmarklet. Human-pacing (a few seconds between searches)
  lowers the risk. The bookmarklet lane never has this problem because *you*
  are the one searching.
- **Verification is the slow part** — one profile open per candidate. A city
  is ~5–10 minutes of Claude working.
- **Needs Claude actively driving** — it's not something that runs on its own.

## When to use which

- **This lane (Claude drives):** you want a city (or several) swept now and
  Claude is in the session. Fastest, zero manual pasting.
- **Bookmarklet lane:** you're working solo without Claude, or Google starts
  bot-checking Claude's automation, or you're mining Instagram surfaces
  (Suggested-for-you, tagged pages) that aren't Google results.

Both write through the same import path and the same ICP, so results are
identical in shape — only the driver differs.

## The reusable prompt

Paste this to kick off a sweep (edit the city list):

> **Sweep these Czech cities for dance-fitness instructors and studios:
> Brno, Ostrava, Plzeň. For each city, drive my Chrome: run a Google
> `site:instagram.com "City" (zumba OR pilates OR barre OR tanec OR fitness)
> lektorka OR instruktorka` search, scrape the Instagram handles off the
> results, then open each plausible profile and verify it against the ICP in
> `docs/INSTRUCTOR_OUTREACH.md` — keep dance-fitness/movement studios AND solo
> instructors (the test is whether a member could do the class at home), reject
> gyms/facilities, reformer/pole/aerial, competition troupes, retail, and
> anything Russia-based. Import verdicts to `/admin/outreach` with the city
> attached, dupes deduped, each reject given a written reason. If Google
> bot-checks you, stop and tell me. When done, regenerate
> `OUTREACH_CZECH_LEADS.md` and report the count + in-band tier.**

For a single city: *"Sweep Brno for instructors (Lane 5 — you drive Chrome)."*
Claude knows the loop from this doc.
