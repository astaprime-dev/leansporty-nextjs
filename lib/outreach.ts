import type { SupabaseClient } from "@supabase/supabase-js";
import { TOUCHES, type TouchNumber } from "@/lib/outreach-templates";

/**
 * Instructor outreach — normalization and import.
 *
 * Every discovery lane (paste-in-the-panel, hashtag sweep, Google Places,
 * Google operators) funnels through importProspects() so dedupe behaves
 * identically no matter where a handle came from. Finding the same account
 * twice is the problem this whole feature exists to solve; it must be solved in
 * exactly one place.
 *
 * All writes need the service-role client — outreach_prospects is RLS-deny-all.
 */

/**
 * Instagram path segments that are never a profile. The second group comes from
 * scraping real studio websites: an embedded Instagram widget puts
 * `instagram.com/embed.js` in the markup, and the mobile deep-link format is
 * `instagram.com/_u/<handle>` — both used to land in the list as prospects.
 */
const RESERVED_HANDLES = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts",
  "direct",
  "about",
  "developer",
  "legal",
  "privacy",
  "terms",
  "help",
  "web",
  "embed",
  "static",
  "rsrc",
  "graphql",
  "api",
  "oauth",
  "ajax",
  "session",
  "challenge",
  "emails",
  "favicon",
  "sitemap",
  "popular",
  // JS artifacts from scraped sites — a template rendering a missing variable
  // produces instagram.com/undefined, which is a "valid" handle shape.
  "undefined",
  "null",
  "_u",
  "_n",
]);

/** A path that is plainly a file, not a person. */
const FILE_EXT_RE =
  /\.(js|mjs|cjs|php|css|html?|png|jpe?g|gif|svg|webp|ico|json|txt|xml|woff2?|mp4|pdf)$/;

const HANDLE_RE = /^[a-z0-9._]{1,30}$/;

/**
 * Reduce anything the founder might paste to a bare, lowercase handle.
 *
 * Accepts `@name`, `name`, `instagram.com/name`, `www.instagram.com/name/`,
 * `https://instagram.com/name?igsh=…` (the share-sheet link — this is what you
 * actually get when copying from the app), and trailing punctuation from a
 * pasted list. Returns null for anything that isn't a profile handle, so junk
 * lines are reported as invalid rather than stored.
 */
export function normalizeHandle(input: string): string | null {
  let value = (input ?? "").trim();
  if (!value) return null;

  // Strip a URL down to its first path segment.
  if (/instagram\.com/i.test(value)) {
    value = value.replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "");
    const path = value.slice(value.indexOf("/") + 1);
    const segments = path.split(/[/?#]/).filter(Boolean);
    // Mobile deep links are instagram.com/_u/<handle> — the handle is one
    // segment further in.
    value =
      (segments[0] === "_u" || segments[0] === "_n"
        ? segments[1]
        : segments[0]) ?? "";
  }

  value = value
    .replace(/^@+/, "")
    .replace(/[.,;:)\]}"'’]+$/, "") // trailing punctuation from a pasted list
    .trim()
    .toLowerCase();

  if (!value || !HANDLE_RE.test(value)) return null;
  if (RESERVED_HANDLES.has(value)) return null;
  if (FILE_EXT_RE.test(value)) return null;
  // Instagram's internal numeric IDs (15+ digits) leak out of embed URLs and
  // look handle-shaped; real vanity numeric handles are short.
  if (/^\d{10,}$/.test(value)) return null;
  return value;
}

/** `@name` or an instagram.com URL — unambiguously a handle, not a word. */
function isMarked(token: string): boolean {
  return token.startsWith("@") || /instagram\.com/i.test(token);
}

/**
 * Pull handles out of a free-text blob, line by line.
 *
 * Parsing is deliberately conservative, because ordinary English words are
 * valid handle shapes: naively splitting on whitespace turns a pasted caption
 * ("just some words") into three junk prospects that then live in the list
 * forever. So:
 *
 *   - a line that is ONE token          → treated as a handle candidate
 *   - a line containing commas          → treated as a list, every token parsed
 *   - a line of space-separated prose   → only the tokens explicitly marked as
 *                                         handles (@name, instagram.com/name)
 *                                         are taken; if none are, the whole
 *                                         line is reported as ignored
 *
 * Anything not taken is returned in `invalid` so the founder can see what was
 * skipped rather than wondering where it went.
 */
export function extractHandles(blob: string): {
  handles: string[];
  invalid: string[];
} {
  const seen = new Set<string>();
  const handles: string[] = [];
  const invalid: string[] = [];

  const take = (token: string): boolean => {
    const handle = normalizeHandle(token);
    if (!handle) return false;
    if (!seen.has(handle)) {
      seen.add(handle);
      handles.push(handle);
    }
    return true;
  };

  for (const rawLine of (blob ?? "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const tokens = line.split(/[\s,]+/).filter(Boolean);

    if (tokens.length === 1) {
      if (!take(tokens[0])) invalid.push(line);
      continue;
    }

    if (line.includes(",")) {
      // An explicit list — every token is meant to be a handle.
      for (const token of tokens) {
        if (!take(token)) invalid.push(token);
      }
      continue;
    }

    // Space-separated prose: only trust explicitly marked tokens.
    const marked = tokens.filter(isMarked);
    if (marked.length === 0) {
      invalid.push(line);
      continue;
    }
    for (const token of marked) {
      if (!take(token)) invalid.push(token);
    }
  }

  return { handles, invalid };
}

/** Pipeline states, in funnel order. */
export const PROSPECT_STATUSES = [
  "new",
  "qualified",
  "rejected",
  "contacted",
  "replied",
  "invited",
  "activated",
  "passed",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

/** A prospect row as the panel consumes it (snake_case straight from the DB). */
export type ProspectRow = {
  id: string;
  handle: string;
  display_name: string | null;
  profile_url: string | null;
  bio: string | null;
  followers: number | null;
  discipline: string | null;
  language: string | null;
  city: string | null;
  country: string | null;
  source: string;
  source_detail: string | null;
  score: number | null;
  score_reason: string | null;
  status: ProspectStatus;
  specific_thing: string | null;
  t1_at: string | null;
  t2_at: string | null;
  t3_at: string | null;
  next_touch_at: string | null;
  invite_code: string | null;
  notes: string | null;
  created_at: string;
};

export type TerritoryRow = {
  id: string;
  country: string;
  city: string | null;
  priority: number;
  hashtags: string[];
  search_queries: string[];
  places_queries: string[];
  status: string;
  last_swept_at: string | null;
  prospects_found: number;
  prospects_qualified: number;
};

export type ProspectSource =
  | "hashtag"
  | "places"
  | "google"
  | "similar"
  | "manual"
  | "inbound";

export type ProspectInput = {
  handle: string;
  displayName?: string | null;
  profileUrl?: string | null;
  bio?: string | null;
  externalLink?: string | null;
  followers?: number | null;
  discipline?: string | null;
  language?: string | null;
  city?: string | null;
  country?: string | null;
  /**
   * Whatever the discovering lane learned about her from somewhere other than
   * her own bio — for the Places sweep, the title and description of the studio
   * website her handle was found on. Instagram serves a login wall to
   * server-side requests, so this is the only text the scorer gets for a
   * swept prospect. Stored in metadata.source_context.
   */
  context?: string | null;
};

export type ImportResult = {
  added: number;
  duplicates: number;
  /** Handles that failed normalization. */
  rejected: string[];
  /** Skipped because they already applied via /teach or already have an account. */
  skippedKnown: string[];
  /** The handles actually inserted — lanes that post-process (the Google-index
   *  sweep sets rule verdicts) need to know which rows are theirs to touch. */
  addedHandles: string[];
};

/**
 * Import a batch of prospects, deduplicated.
 *
 * Three ways a handle can fail to become a new row, and they mean different
 * things to the founder, so they're reported separately:
 *   - rejected     — not a valid handle (a caption, a hashtag, a broken URL)
 *   - skippedKnown — she already applied through /teach, or is already an
 *                    instructor here. DMing her a cold opener would be a
 *                    credibility own-goal.
 *   - duplicates   — already in the list. The normal, expected case.
 */
export async function importProspects(
  db: SupabaseClient,
  params: {
    source: ProspectSource;
    sourceDetail?: string | null;
    territoryId?: string | null;
    prospects: ProspectInput[];
  }
): Promise<ImportResult> {
  const { source, sourceDetail = null, territoryId = null } = params;

  const rejected: string[] = [];
  const byHandle = new Map<string, ProspectInput>();
  for (const p of params.prospects) {
    const handle = normalizeHandle(p.handle);
    if (!handle) {
      rejected.push(p.handle);
      continue;
    }
    // Last write wins within a batch — later lanes usually carry more detail.
    byHandle.set(handle, { ...p, handle });
  }

  if (byHandle.size === 0) {
    return { added: 0, duplicates: 0, rejected, skippedKnown: [], addedHandles: [] };
  }

  const handles = Array.from(byHandle.keys());

  // Already in the list?
  const { data: existingRows, error: existingError } = await db
    .from("outreach_prospects")
    .select("handle")
    .in("handle", handles);
  if (existingError) throw existingError;
  const existing = new Set((existingRows ?? []).map((r) => r.handle as string));

  // Already ours — an instructor, or someone who applied through /teach. Both
  // sides of that funnel are in the DB already; look them up rather than
  // trusting memory.
  const known = await findKnownHandles(db, handles);

  const toInsert = handles.filter((h) => !existing.has(h) && !known.has(h));
  const skippedKnown = handles.filter((h) => known.has(h) && !existing.has(h));

  if (toInsert.length > 0) {
    const rows = toInsert.map((handle) => {
      const p = byHandle.get(handle)!;
      return {
        handle,
        display_name: p.displayName ?? null,
        profile_url: p.profileUrl ?? `https://instagram.com/${handle}`,
        bio: p.bio ?? null,
        external_link: p.externalLink ?? null,
        followers: p.followers ?? null,
        discipline: p.discipline ?? null,
        language: p.language ?? null,
        city: p.city ?? null,
        country: p.country ?? null,
        territory_id: territoryId,
        source,
        source_detail: sourceDetail,
        metadata: p.context ? { source_context: p.context } : {},
      };
    });

    // ignoreDuplicates guards the race where two sweeps import the same handle
    // at once — the unique index is the real authority, not the SELECT above.
    const { error: insertError } = await db
      .from("outreach_prospects")
      .upsert(rows, { onConflict: "handle", ignoreDuplicates: true });
    if (insertError) throw insertError;
  }

  if (territoryId && toInsert.length > 0) {
    await bumpTerritoryFound(db, territoryId, toInsert.length);
  }

  return {
    added: toInsert.length,
    duplicates: existing.size,
    rejected,
    skippedKnown,
    addedHandles: toInsert,
  };
}

/**
 * Handles that already belong to someone in the product: an existing account
 * (user_profiles.instagram_handle) or a /teach applicant (leads.metadata.social,
 * where the form stores whatever she typed — often a full URL).
 */
async function findKnownHandles(
  db: SupabaseClient,
  handles: string[]
): Promise<Set<string>> {
  const known = new Set<string>();

  const { data: profiles } = await db
    .from("user_profiles")
    .select("instagram_handle")
    .not("instagram_handle", "is", null);
  for (const row of profiles ?? []) {
    const h = normalizeHandle(String(row.instagram_handle ?? ""));
    if (h) known.add(h);
  }

  const { data: leads } = await db
    .from("leads")
    .select("metadata")
    .eq("source", "teach-apply");
  for (const row of leads ?? []) {
    const social = (row.metadata as Record<string, unknown> | null)?.social;
    if (typeof social !== "string") continue;
    const h = normalizeHandle(social);
    if (h) known.add(h);
  }

  // Intersect rather than returning the whole world.
  return new Set(handles.filter((h) => known.has(h)));
}

async function bumpTerritoryFound(
  db: SupabaseClient,
  territoryId: string,
  n: number
): Promise<void> {
  const { data } = await db
    .from("outreach_territories")
    .select("prospects_found")
    .eq("id", territoryId)
    .maybeSingle();
  if (!data) return;
  await db
    .from("outreach_territories")
    .update({
      prospects_found: (data.prospects_found ?? 0) + n,
      last_swept_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", territoryId);
}

/**
 * When the next touch is due after sending touch `n`. Touch 2 lands +3 days,
 * Touch 3 +4 days after that (docs/INSTRUCTOR_OUTREACH.md). After Touch 3 there
 * is no next touch — the sequence is over; she replies or she doesn't.
 */
export function nextTouchAfter(n: TouchNumber, from = new Date()): string | null {
  const next = TOUCHES[(n + 1) as TouchNumber];
  if (!next) return null;
  const due = new Date(from);
  due.setDate(due.getDate() + next.waitDays);
  return due.toISOString();
}

/** Invite code convention from docs/INSTRUCTOR_INVITES.md: ls-<name>-<hex>. */
export function buildInviteCode(name: string | null | undefined): string {
  const slug = (name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics: "Zofia" stays "zofia"
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return slug ? `ls-${slug}-${hex}` : `ls-${hex}`;
}
