# The collector bookmarklet — browser-native lead sweeps

One bookmark. You browse in your own Chrome (optionally through a country VPN,
so Google shows what a local sees); one click collects every Instagram profile
handle visible on the page to your clipboard; paste into **Add handles** in
`/admin/outreach`. Dedupe, known-skip, review queue — all downstream machinery
unchanged.

No provider, no API key, no requests to Instagram beyond the page you're
already looking at. It only reads the rendered DOM — the same ground rules as
every sweep: read-only, human-paced, your session, never automated sending.

## Install (30 seconds)

1. In Chrome: bookmarks bar → right-click → **Add page…**
2. Name: `Collect handles`
3. URL: paste the one-liner below (paste into the bookmark's URL field —
   Chrome strips `javascript:` if pasted into the address bar instead).

```
javascript:(()=>{const RES=new Set(["p","reel","reels","tv","stories","explore","accounts","direct","about","developer","legal","privacy","terms","help","web","embed","static","rsrc","graphql","api","oauth","ajax","session","challenge","emails","favicon","sitemap","popular","directory","undefined","null","_u","_n"]);const RE=/^[a-z0-9._]{1,30}$/;const out=new Set();const take=h=>{h=(h||"").toLowerCase().replace(/^@+/,"");if(RE.test(h)&&!RES.has(h)&&!/\.(js|php|css|html?|png|jpe?g|svg|json)$/.test(h)&&!/^\d{10,}$/.test(h))out.add(h)};for(const a of document.querySelectorAll("a[href]")){let h=a.getAttribute("href");if(!h)continue;if(h.startsWith("/url?")){const q=new URL(h,"https://www.google.com").searchParams.get("q");if(q)h=q}try{const u=new URL(h,location.href);if(!/(^|\.)instagram\.com$/.test(u.hostname))continue;const s=u.pathname.split("/").filter(Boolean);if(!s.length)continue;if((s[0]==="_u"||s[0]==="_n")&&s[1]){take(s[1]);continue}if(s[0]==="p"||s[0]==="reel"||s[0]==="reels"||s[0]==="tv"){let m=(a.textContent||"").match(/\(@([a-z0-9._]{1,30})\)/i);if(!m){const w=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const mm=n.textContent.trim().match(/^Instagram\s*[·•]\s*([a-z0-9._]{1,30})$/);if(mm){m=mm;break}}}if(m)take(m[1]);continue}take(s[0])}catch(e){}}const T=document.body.innerText||"";for(const m of T.matchAll(/instagram\.com\/([a-z0-9._]{2,30})/gi))take(m[1]);const list=[...out];const d=document.createElement("div");d.style.cssText="position:fixed;top:16px;right:16px;z-index:999999;background:#111;color:#fff;padding:10px 16px;border-radius:10px;font:14px/1.4 system-ui;box-shadow:0 4px 16px rgba(0,0,0,.3)";document.body.appendChild(d);const done=t=>{d.textContent=t;setTimeout(()=>d.remove(),3000)};if(!list.length){done("no Instagram handles on this page")}else{navigator.clipboard.writeText(list.join("\n")).then(()=>done(list.length+" handles copied — paste into Add handles")).catch(()=>{console.log(list.join("\n"));done(list.length+" found — clipboard blocked, list in console")})}})();
```

## More results per page (avoid paginating)

Google **removed the `num=100` parameter in late 2025** — it now silently
returns 10 per page no matter what. Don't fight it. Instead use **Bing**, which
still honors results-per-page and is friendlier to `site:` queries:

```
https://www.bing.com/search?count=50&q=site:instagram.com "Brno" (zumba OR pilates) lektorka
```

`&count=50` → up to 50 results on one page → one bookmarklet click. The
bookmarklet reads instagram.com handles from the page **text** (not just
links), so it works on Bing, DuckDuckGo, Startpage, or Google identically —
even when the engine wraps its result links. Quality is still front-loaded, so
the tail of a 50-result page is mostly venues/dupes; the collector + the
in-app triage handle that.

## The loop, per city

1. **Cities tab** → copy the city's **Google query** (seeded, localized terms).
2. Run it in a normal Google tab. VPN to the country first if you want truly
   local rankings — Google localizes results by IP, which is exactly why this
   beats any search API.
3. Click **Collect handles** on the results page → "N handles copied".
4. `/admin/outreach` → **Add handles** → paste. Done: deduped, known-skipped,
   queued for review.

Same click works on the higher-yield surfaces — yield varies by page type,
because Instagram's grids link *posts*, not people:

| Where you click | Expect |
|---|---|
| **Followers / Following modal** on any instructor or studio | Dozens — every row is a profile link; the richest surface |
| **"Suggested for you"** — expand it first (the ⌄ next to Follow) | 10–20 similar instructors |
| **An opened post** (author + collab + tagged + commenters) | Several |
| **Google results page** | 5–20 (profile hits from the link, post hits from the "Instagram · handle" source line) |
| **A studio's website** | The footer/embed handles |
| Any raw grid (hashtag / Tagged / profile posts) *without* opening a post | ~0–1 — Instagram's design, not the tool's |

## What it filters out on its own

Non-Instagram links, `/reel/` `/p/` `/explore/` `/popular/` and other
non-profile paths, widget junk (`embed.js`), and file-looking handles. The page
you're viewing is included when it's a profile — usually that's a lead too.
Everything else (studio-vs-person, follower band) is judged after import: paste
freely, the list sorts it out.

## Source (readable)

```js
(() => {
  const RES = new Set(["p","reel","reels","tv","stories","explore","accounts",
    "direct","about","developer","legal","privacy","terms","help","web","embed",
    "static","rsrc","graphql","api","oauth","ajax","session","challenge",
    "emails","favicon","sitemap","popular","directory","_u","_n"]);
  const RE = /^[a-z0-9._]{1,30}$/;
  const out = new Set();
  const take = (h) => {
    h = (h || "").toLowerCase().replace(/^@+/, "");
    if (RE.test(h) && !RES.has(h) &&
        !/\.(js|php|css|html?|png|jpe?g|svg|json)$/.test(h)) out.add(h);
  };
  for (const a of document.querySelectorAll("a[href]")) {
    let h = a.getAttribute("href");
    if (!h) continue;
    // Google sometimes wraps results as /url?q=<real url>
    if (h.startsWith("/url?")) {
      const q = new URL(h, "https://www.google.com").searchParams.get("q");
      if (q) h = q;
    }
    try {
      const u = new URL(h, location.href); // resolves Instagram's relative links
      if (!/(^|\.)instagram\.com$/.test(u.hostname)) continue;
      const s = u.pathname.split("/").filter(Boolean);
      if (!s.length) continue;
      if ((s[0] === "_u" || s[0] === "_n") && s[1]) { take(s[1]); continue; }
      // A bare post/reel link carries no handle in the URL, but Google's
      // result block does — "Name (@handle) • Instagram" in titles, or the
      // "Instagram · handle" source line above post results. Two live-verified
      // traps there: (1) the source line often shows a display NAME ("Instagram
      // · Eliska Bártová") — handles are always lowercase, so the pattern is
      // case-sensitive; (2) textContent glues adjacent nodes ("ckcaprock" +
      // "50+ likes" → "ckcaprock50"), so match inside a single text node,
      // anchored at both ends.
      if (s[0] === "p" || s[0] === "reel" || s[0] === "reels" || s[0] === "tv") {
        let m = (a.textContent || "").match(/\(@([a-z0-9._]{1,30})\)/i);
        if (!m) {
          const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            const mm = n.textContent.trim()
              .match(/^Instagram\s*[·•]\s*([a-z0-9._]{1,30})$/);
            if (mm) { m = mm; break; }
          }
        }
        if (m) take(m[1]);
        continue;
      }
      take(s[0]); // first path segment = the handle (profile, or author of /handle/reel/…)
    } catch {}
  }
  const list = [...out];
  const d = document.createElement("div");
  d.style.cssText = "position:fixed;top:16px;right:16px;z-index:999999;" +
    "background:#111;color:#fff;padding:10px 16px;border-radius:10px;" +
    "font:14px/1.4 system-ui;box-shadow:0 4px 16px rgba(0,0,0,.3)";
  document.body.appendChild(d);
  const done = (t) => { d.textContent = t; setTimeout(() => d.remove(), 3000); };
  if (!list.length) { done("no Instagram handles on this page"); return; }
  navigator.clipboard.writeText(list.join("\n"))
    .then(() => done(list.length + " handles copied — paste into Add handles"))
    .catch(() => { console.log(list.join("\n"));
      done(list.length + " found — clipboard blocked, list in console"); });
})();
```

The handle-shape rules here mirror `normalizeHandle()` in `lib/outreach.ts` —
if one changes, change both.
