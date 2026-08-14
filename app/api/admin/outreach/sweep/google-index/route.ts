import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSecret } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { importProspects, type ProspectInput } from "@/lib/outreach";
import {
  buildQueries,
  classify,
  parseCseItem,
  type Classified,
  type CseItem,
} from "@/lib/outreach-google-index";

export const runtime = "nodejs";
export const maxDuration = 60;

const SERPER_ENDPOINT = "https://google.serper.dev/search";
const CSE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
/** CSE only: two pages of ten. Serper returns 20 in one call. */
const PAGES = 2;
const FETCH_TIMEOUT_MS = 8000;

/**
 * POST /api/admin/outreach/sweep/google-index
 *
 * The no-AI discovery lane: Google's index of instagram.com, searched through
 * the official Custom Search API. Handle, name and follower count are parsed
 * from result metadata (lib/outreach-google-index.ts); keyword rules auto-file
 * the studios/ballroom/pole/kids and the out-of-band follower counts; whatever
 * survives lands in New for the founder's ten-second yes/no. Instagram itself
 * is never contacted.
 *
 * Body: { territoryId, queryIndex? }. One query per invocation, exactly like
 * the Places sweep — the panel walks nextQueryIndex until null. Runs the two
 * seeded operator queries plus the templates in lib/outreach-google-index.ts.
 *
 * Every parsed result is imported — auto-rejected ones too, with the rule that
 * fired as score_reason — so the same account never resurfaces from any lane.
 * Rule verdicts are written only to rows this sweep just inserted; a handle
 * already in the list keeps whatever status and score it has. Territory status
 * is left alone (it tracks the Places walk); last_swept_at bumps on import.
 *
 * Search backend: SERPER_API_KEY (serper.dev — Google results as an API,
 * 2,500 free queries then ~$1/1,000; a full city sweep is ~5). Setup is one
 * signup and one env var. Google's own Custom Search JSON API is NOT an
 * option for this project — it was closed to new customers (shutdown
 * 2027-01-01) and returns 403 "project does not have access" no matter what
 * is enabled; the CSE branch below survives only for grandfathered keys.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrSecret(request);
  if (!auth.ok) return auth.response;

  const serperKey = process.env.SERPER_API_KEY;
  const cseKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!serperKey && !(cseKey && cseId)) {
    return NextResponse.json(
      {
        error:
          "Search sweep is not configured — set SERPER_API_KEY (serper.dev). Google's Custom Search API is closed to new customers and is not an option.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const territoryId =
      typeof body?.territoryId === "string" ? body.territoryId : null;
    const queryIndex = Number.isInteger(body?.queryIndex) ? body.queryIndex : 0;
    if (!territoryId) {
      return NextResponse.json({ error: "territoryId required" }, { status: 400 });
    }

    const db = getServiceRoleClient();
    const { data: territory, error: tErr } = await db
      .from("outreach_territories")
      .select("id,country,city,search_queries")
      .eq("id", territoryId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!territory) {
      return NextResponse.json({ error: "territory not found" }, { status: 404 });
    }

    const queries = buildQueries({
      city: territory.city as string | null,
      country: territory.country as string,
      search_queries: (territory.search_queries as string[]) ?? [],
    });
    const query = queries[queryIndex];
    if (!query) {
      return NextResponse.json(
        { error: "no query at that index", queries: queries.length },
        { status: 400 }
      );
    }

    const items = serperKey
      ? await searchSerper(serperKey, query)
      : await searchIndex(cseKey!, cseId!, query);

    // One verdict per handle within the batch: keep the result that actually
    // carried a follower count — a profile hit beats a stray /reel/ hit.
    const byHandle = new Map<string, Classified>();
    for (const item of items) {
      const parsed = parseCseItem(item);
      if (!parsed) continue;
      const existing = byHandle.get(parsed.handle);
      if (existing && existing.followers !== null) continue;
      byHandle.set(parsed.handle, classify(parsed));
    }
    const classified = Array.from(byHandle.values());

    const prospects: ProspectInput[] = classified.map((c) => ({
      handle: c.handle,
      displayName: c.displayName,
      followers: c.followers,
      city: (territory.city as string | null) ?? null,
      country: territory.country as string,
      context: c.evidence,
    }));

    const result = await importProspects(db, {
      source: "google",
      sourceDetail: query,
      territoryId,
      prospects,
    });

    // Rule verdicts, written only to the rows this sweep created. The
    // status='new' guard keeps a concurrent import's row untouched if the
    // upsert race dropped ours.
    const added = new Set(result.addedHandles);
    let autoRejected = 0;
    let toReview = 0;
    let unknown = 0;
    const now = new Date().toISOString();
    for (const c of classified) {
      if (!added.has(c.handle)) continue;
      if (c.verdict === "candidate") {
        toReview++;
        if (c.score === null) {
          unknown++;
          continue; // stays plain 'new', like a pasted handle
        }
        await db
          .from("outreach_prospects")
          .update({
            score: c.score,
            score_reason: c.reason,
            scored_at: now,
            updated_at: now,
          })
          .eq("handle", c.handle)
          .eq("status", "new");
      } else {
        autoRejected++;
        await db
          .from("outreach_prospects")
          .update({
            status: "rejected",
            score_reason: c.reason,
            scored_at: now,
            updated_at: now,
          })
          .eq("handle", c.handle)
          .eq("status", "new");
      }
    }

    return NextResponse.json({
      query,
      results: items.length,
      added: result.added,
      duplicates: result.duplicates,
      skippedKnown: result.skippedKnown.length,
      toReview,
      autoRejected,
      unknown,
      nextQueryIndex: queryIndex + 1 < queries.length ? queryIndex + 1 : null,
      queriesTotal: queries.length,
    });
  } catch (e) {
    console.error("Google index sweep failed:", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}

/**
 * One Serper.dev call — Google's results as JSON. Twenty organic results per
 * query (2 credits). Serper has no pagemap, but Google's snippet for an
 * Instagram profile is its og:description ("12K Followers, …"), so the
 * follower parser reads it from `snippet` unchanged.
 */
async function searchSerper(apiKey: string, query: string): Promise<CseItem[]> {
  const res = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: 20 }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Serper search failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  return (data.organic ?? []).map((r) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
  }));
}

/** Up to two pages of Custom Search results — grandfathered CSE keys only. */
async function searchIndex(
  apiKey: string,
  cseId: string,
  query: string
): Promise<CseItem[]> {
  const out: CseItem[] = [];
  for (let page = 0; page < PAGES; page++) {
    const params = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: query,
      num: "10",
      start: String(page * 10 + 1),
    });
    const res = await fetch(`${CSE_ENDPOINT}?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Custom Search failed (${res.status}): ${detail.slice(0, 300)}`
      );
    }
    const data = (await res.json()) as { items?: CseItem[] };
    const items = data.items ?? [];
    out.push(...items);
    if (items.length < 10) break; // no second page
  }
  return out;
}
