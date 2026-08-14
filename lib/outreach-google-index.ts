import { normalizeHandle } from "@/lib/outreach";
import type { TerritoryRow } from "@/lib/outreach";

/**
 * Google-index sweep — the no-AI discovery lane.
 *
 * Google's copy of every public Instagram profile carries the data we need:
 * the result title is "Name | role | city (@handle) • Instagram photos and
 * videos" and the page metadata (og:description) is "12K Followers, 607
 * Following, 234 Posts - …". So handle, display name and follower count come
 * out of the Custom Search API with regexes — Instagram itself is never
 * touched, which is why this lane has no login-wall problem and no account
 * risk.
 *
 * Judgment is split deliberately: rules do the *negative* work (studios,
 * ballroom, pole, kids — the exclusions written in the playbook and formerly in
 * the scorer prompt) plus the follower band; the FOUNDER does the positive
 * work, reviewing what survives in the New tab at ~10 seconds a card. Rules
 * are transparent (every verdict names the rule that fired) and repeatable —
 * the same input always classifies the same way.
 *
 * Everything here is pure — parsing and classification only, no I/O — so it
 * can be exercised against saved search responses.
 */

// ---------------------------------------------------------------------------
// CONFIG — tune these lists freely; no other code needs to change.
// ---------------------------------------------------------------------------

/**
 * Extra queries run for every city on top of the two seeded in
 * outreach_territories.search_queries. {city} is replaced with the territory's
 * city name. These are the shapes that actually produced in-band instructors
 * in the 2026-08-03 manual session (OUTREACH_LEADS_2026-08-03.md).
 */
export const QUERY_TEMPLATES: string[] = [
  'site:instagram.com "{city}" zumba (instruktorka OR instructor OR trenerka)',
  'site:instagram.com "{city}" ("dance fitness" OR "high heels" OR barre) (instructor OR instruktorka OR trenerka)',
  'site:instagram.com "{city}" (pilates OR "strong nation" OR "fit dance") (instructor OR instruktorka OR trenerka)',
];

/**
 * Substring matches (lowercased) that auto-reject a result. The negative half
 * of the playbook ICP. The test is a CONTENT-FORMAT one, not an org one: reject
 * things whose classes a member can't do at home (needs a machine/rig/pool/a
 * building) or that aren't movement content at all (retail, kids, art-form
 * dance). Do NOT reject a business just for being one — a dance-fitness /
 * zumba / stretching / movement STUDIO with an audience is a first-class lead
 * (it brings the distribution a solo instructor lacks; founder correction
 * 2026-08-14). "studio/škola/club/academy/centrum" were removed from this list
 * for exactly that reason. Gyms/chains stay out for a practical reason (a
 * facility brand won't onboard on a new platform), not a purity one.
 *
 * Matched against the account's NAME and HANDLE only — never her bio.
 */
export const EXCLUDE_KEYWORDS: string[] = [
  // A facility or a shop (sells access/goods, not at-home class content)
  "gym",
  "gimnastyka",
  "sklep",
  "shop",
  // Dance as an art form, not fitness (playbook: competition, partner, kids)
  "ballroom",
  "towarzysk",
  "balet",
  "ballet",
  "wedding",
  "pierwszy taniec",
  "first dance",
  "mistrzyni",
  "mistrz ",
  "champion",
  "kids",
  "dzieci",
  "junior",
  // Needs equipment or a venue, not a living room. Bare "pole" is deliberate:
  // in this domain a name containing it is a pole studio (poleheavencz,
  // vertigo_pole_fitness — both slipped the compound-only version), and
  // "reformer" in a name means a machine-pilates studio.
  "pole",
  "reformer",
  "aerial",
  "aqua",
  // Czech gym slang that names venues ("to_fitko")
  "fitko",
];

/**
 * At least one of these (substring, lowercased) must appear or the result is
 * dropped as "no instructor signal" — this is what keeps real-estate listings
 * and city hashtag pages out of the list when Google pads thin results.
 */
export const INCLUDE_KEYWORDS: string[] = [
  "instruktor", // covers instruktorka
  "instructor", // covers instructora
  "instrutora",
  "trenerka",
  "trainer",
  "teacher",
  "coach",
  "zumba",
  "dance",
  "taniec",
  "baile",
  "dança",
  "fitness",
  "pilates",
  "barre",
  "high heels",
  "stretching",
  "trening",
  "workout",
];

/** Follower band, per the ICP's "5k–50k with real engagement". */
export const BAND = {
  /** Below this: real instructor, no audience to bring — filed, not queued. */
  min: 3_000,
  sweetMin: 5_000,
  sweetMax: 50_000,
  /** Above this: mega-influencer territory — they want guarantees. */
  max: 80_000,
};

// ---------------------------------------------------------------------------
// Parsing — Custom Search API items → candidates
// ---------------------------------------------------------------------------

/** The slice of a customsearch/v1 result item this lane reads. */
export type CseItem = {
  title?: string;
  link?: string;
  snippet?: string;
  pagemap?: { metatags?: Array<Record<string, string>> };
};

export type ParsedResult = {
  handle: string;
  displayName: string | null;
  followers: number | null;
  /** title + snippet + og:description — the evidence the founder reviews. */
  evidence: string;
};

const TITLE_HANDLE_RE = /\(@([a-z0-9._]{1,30})\)/i;
/** "12K Followers, 607 Following" / "3,329 followers" / localized variants. */
const FOLLOWERS_RE =
  /([\d][\d.,]*)\s*([km]\b|tys\.?|mln)?\s*(followers?|obserwuj|seguidores|abonnés)/i;
const TITLE_SUFFIX_RE =
  /\s*[•·|-]\s*(instagram photos.*|fotos y videos.*|instagram)$/i;

function parseCount(num: string, suffix: string | undefined): number | null {
  const base = parseFloat(
    suffix ? num.replace(",", ".") : num.replace(/[^\d]/g, "")
  );
  if (!Number.isFinite(base)) return null;
  const s = (suffix ?? "").toLowerCase();
  if (s === "k" || s.startsWith("tys")) return Math.round(base * 1_000);
  if (s === "m" || s === "mln") return Math.round(base * 1_000_000);
  return Math.round(base);
}

/**
 * One search result → one candidate, or null when the result isn't a profile
 * (a /reel/ or /p/ link with no handle in the title, a non-Instagram page
 * Google slipped in, an /explore/ or /popular/ aggregator page).
 */
export function parseCseItem(item: CseItem): ParsedResult | null {
  const title = item.title ?? "";
  const link = item.link ?? "";

  // Prefer the URL (instagram.com/<handle>/…); fall back to "(@handle)" in the
  // title, which is how a /reel/ result still yields its author.
  let handle = /instagram\.com/i.test(link) ? normalizeHandle(link) : null;
  if (!handle) {
    const m = title.match(TITLE_HANDLE_RE);
    handle = m ? normalizeHandle(m[1]) : null;
  }
  if (!handle) return null;

  const og = (item.pagemap?.metatags ?? [])
    .map((t) => t["og:description"] ?? t["twitter:description"] ?? "")
    .find(Boolean);

  const displayName =
    title
      .split(/\s*\(@/)[0]
      .replace(TITLE_SUFFIX_RE, "")
      .trim() || null;

  const followersSource = [og, item.snippet, title].filter(Boolean) as string[];
  let followers: number | null = null;
  for (const text of followersSource) {
    const m = text.match(FOLLOWERS_RE);
    if (m) {
      followers = parseCount(m[1], m[2]);
      break;
    }
  }

  const evidence = [title, item.snippet, og]
    .filter(Boolean)
    .join(" — ")
    .replace(/\s+/g, " ")
    .slice(0, 1000);

  return { handle, displayName, followers, evidence };
}

// ---------------------------------------------------------------------------
// Classification — the rule half of the judgment
// ---------------------------------------------------------------------------

export type Verdict =
  /** Survives the rules — lands in New for the founder's yes/no. */
  | "candidate"
  /** A rule fired — imported as rejected so she never resurfaces. */
  | "excluded"
  | "below_band"
  | "above_band";

export type Classified = ParsedResult & {
  verdict: Verdict;
  /** Sort order for the review queue; null when followers are unknown. */
  score: number | null;
  reason: string;
};

export function classify(parsed: ParsedResult): Classified {
  // Who she IS (name + handle) vs everything we saw (incl. bio text). Excludes
  // read only the identity; includes read everything — see EXCLUDE_KEYWORDS.
  const identity = `${parsed.handle} ${parsed.displayName ?? ""}`.toLowerCase();
  const blob = `${identity} ${parsed.evidence}`.toLowerCase();

  const excluded = EXCLUDE_KEYWORDS.find((w) => identity.includes(w));
  if (excluded) {
    return {
      ...parsed,
      verdict: "excluded",
      score: null,
      reason: `rule: matched "${excluded.trim()}" in the account name`,
    };
  }

  // Russia-based accounts are excluded on principle (founder policy,
  // 2026-08-08): no Russian clients until the war ends and Russia has paid
  // full reparations to Ukraine. A .ru domain in the bio/evidence is the tell.
  // (Russian-SPEAKING diaspora elsewhere is fine — location, not language.)
  if (/\.ru\b/i.test(blob)) {
    return {
      ...parsed,
      verdict: "excluded",
      score: null,
      reason: "rule: links to a .ru domain — Russia-based, excluded market (no payout rail)",
    };
  }

  if (!INCLUDE_KEYWORDS.some((w) => blob.includes(w))) {
    return {
      ...parsed,
      verdict: "excluded",
      score: null,
      reason: "rule: no instructor signal in title/snippet",
    };
  }

  const f = parsed.followers;
  if (f !== null) {
    if (f < BAND.min) {
      return {
        ...parsed,
        verdict: "below_band",
        score: null,
        reason: `rule: ${f.toLocaleString("en-US")} followers — below band (min ${BAND.min / 1000}k); real instructor, revisit in 6–12 months`,
      };
    }
    if (f > BAND.max) {
      return {
        ...parsed,
        verdict: "above_band",
        score: null,
        reason: `rule: ${f.toLocaleString("en-US")} followers — above band (max ${BAND.max / 1000}k)`,
      };
    }
    const sweet = f >= BAND.sweetMin && f <= BAND.sweetMax;
    return {
      ...parsed,
      verdict: "candidate",
      score: sweet ? 70 : 55,
      reason: sweet
        ? `rule: ${f.toLocaleString("en-US")} followers — in the 5k–50k band`
        : `rule: ${f.toLocaleString("en-US")} followers — edge of band`,
    };
  }

  return {
    ...parsed,
    verdict: "candidate",
    score: null,
    reason: "rule: instructor signal, followers unknown — check her profile",
  };
}

/**
 * The full query list for one city: its two seeded operator queries plus the
 * templates above, deduplicated. Order matters — the walker runs them by index.
 */
export function buildQueries(
  territory: Pick<TerritoryRow, "city" | "country" | "search_queries">
): string[] {
  const place = territory.city ?? territory.country;
  const rendered = QUERY_TEMPLATES.map((t) => t.replaceAll("{city}", place));
  return Array.from(new Set([...(territory.search_queries ?? []), ...rendered]));
}
