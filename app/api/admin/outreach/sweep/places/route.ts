import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSecret } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  importProspects,
  normalizeHandle,
  type ProspectInput,
} from "@/lib/outreach";

export const runtime = "nodejs";
export const maxDuration = 60;

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
/** Studio sites fetched per invocation — keeps us inside the 60s function cap. */
const MAX_SITES = 18;
const SITE_TIMEOUT_MS = 8000;
const POLITE_DELAY_MS = 400;
const UA =
  "LeanSportyBot/1.0 (+https://leansporty.com; instructor outreach research)";

const IG_RE = /(?:instagram\.com\/)([A-Za-z0-9._]{2,30})/gi;

/**
 * POST /api/admin/outreach/sweep/places
 *
 * The genuinely city-by-city discovery lane, and the one that finds people
 * hashtags miss: Google Places gives us the dance/fitness studios in a city,
 * their websites give us the Instagram handles of the studio and usually its
 * instructors.
 *
 * Body: { territoryId, queryIndex? }. One Places query per invocation (a
 * territory seeds three), so a run stays inside the function timeout — call it
 * again with the next queryIndex, or let the panel walk them.
 *
 * Costs nothing at our scale: Text Search Pro has 5,000 free calls a month and
 * a city is 1–3 calls. GOOGLE_API_KEY already exists for the Drive importer,
 * but Places API (New) must be enabled for it in Google Cloud.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrSecret(request);
  if (!auth.ok) return auth.response;

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY is not configured" },
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
      .select("id,country,city,places_queries")
      .eq("id", territoryId)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!territory) {
      return NextResponse.json({ error: "territory not found" }, { status: 404 });
    }

    const siteOffset = Number.isInteger(body?.siteOffset) ? body.siteOffset : 0;
    const queries = (territory.places_queries as string[]) ?? [];
    const query = queries[queryIndex];
    if (!query) {
      return NextResponse.json(
        { error: "no query at that index", queries: queries.length },
        { status: 400 }
      );
    }

    await db
      .from("outreach_territories")
      .update({ status: "sweeping", updated_at: new Date().toISOString() })
      .eq("id", territoryId);

    const places = await searchPlaces(apiKey, query);
    // A busy city returns more studios than we can fetch inside one function
    // timeout, so walk them in windows rather than dropping the tail — Warsaw's
    // first query alone had 37 sites against a cap of 18.
    const allSites = places.filter((p) => p.websiteUri);
    const sites = allSites.slice(siteOffset, siteOffset + MAX_SITES);
    const moreSites = siteOffset + MAX_SITES < allSites.length;

    const found: ProspectInput[] = [];

    for (const place of sites) {
      const { handles, context } = await scrapeSite(place.websiteUri!);
      const studio = place.displayName?.text ?? null;
      for (const handle of handles) {
        found.push({
          handle,
          city: (territory.city as string | null) ?? null,
          country: territory.country as string,
          // The scorer can't read her Instagram bio (Instagram login-walls
          // server-side requests), so the studio's own words are the only
          // signal it gets — and they're what separates "zumba, zajęcia dla
          // kobiet" from "szkoła tańca towarzyskiego".
          context: [studio, context].filter(Boolean).join(" — ").slice(0, 1000) || null,
        });
      }
      await sleep(POLITE_DELAY_MS);
    }

    const result = await importProspects(db, {
      source: "places",
      sourceDetail: query,
      territoryId,
      prospects: found,
    });

    const lastQuery = queryIndex >= queries.length - 1;
    const done = lastQuery && !moreSites;
    await db
      .from("outreach_territories")
      .update({
        status: done ? "swept" : "sweeping",
        last_swept_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", territoryId);

    return NextResponse.json({
      query,
      placesReturned: places.length,
      sitesFetched: sites.length,
      sitesRemainingInQuery: Math.max(0, allSites.length - (siteOffset + sites.length)),
      ...result,
      // Finish the current query's sites before moving to the next query, so a
      // big city is fully covered instead of quietly truncated.
      nextSiteOffset: moreSites ? siteOffset + MAX_SITES : null,
      nextQueryIndex: moreSites ? queryIndex : lastQuery ? null : queryIndex + 1,
    });
  } catch (e) {
    console.error("Places sweep failed:", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}

type Place = {
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
};

/** One Text Search (New) call, plus its second page if there is one. */
async function searchPlaces(apiKey: string, textQuery: string): Promise<Place[]> {
  const out: Place[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 2; page++) {
    const res = await fetch(PLACES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // Field mask keeps this on the Pro SKU (5,000 free calls/month).
        // Adding rating or reviews would push it to Enterprise pricing.
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.websiteUri,nextPageToken",
      },
      body: JSON.stringify({ textQuery, pageSize: 20, pageToken }),
      signal: AbortSignal.timeout(SITE_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Places search failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      places?: Place[];
      nextPageToken?: string;
    };
    out.push(...(data.places ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

/**
 * Pull Instagram handles out of a studio's homepage. Same defensive shape as
 * the Drive link importer (app/api/instructor/programs/[id]/lessons/link):
 * validate the URL, http/https only, hard timeout, and never follow anything
 * we didn't get from Google.
 */
async function scrapeSite(
  rawUrl: string
): Promise<{ handles: string[]; context: string | null }> {
  const empty = { handles: [], context: null };
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return empty;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return empty;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(SITE_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return empty;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return empty;

    // Homepages are small; cap anyway so a pathological page can't eat the run.
    const html = (await res.text()).slice(0, 500_000);

    const handles = new Set<string>();
    for (const match of Array.from(html.matchAll(IG_RE))) {
      const handle = normalizeHandle(match[1]);
      if (handle) handles.add(handle);
      // A studio site linking twenty accounts is a directory, not a studio —
      // take the first few and move on.
      if (handles.size >= 4) break;
    }

    return { handles: Array.from(handles), context: pageContext(html) };
  } catch {
    return empty; // unreachable or slow site — not worth a retry
  }
}

/** The studio's own description of itself: <title> + meta description. */
function pageContext(html: string): string | null {
  const title = html.match(/<title[^>]*>([^<]{0,200})<\/title>/i)?.[1];
  const desc =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})["']/i
    )?.[1] ??
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{0,400})["']/i
    )?.[1];
  const text = [title, desc].filter(Boolean).join(" — ").replace(/\s+/g, " ").trim();
  return text || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
