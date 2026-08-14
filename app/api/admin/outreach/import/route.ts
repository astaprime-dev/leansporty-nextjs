import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSecret } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  importProspects,
  extractHandles,
  type ProspectInput,
  type ProspectSource,
} from "@/lib/outreach";

export const runtime = "nodejs";

const MAX_PROSPECTS = 500;
const MAX_BLOB_CHARS = 100_000;

const SOURCES: ProspectSource[] = [
  "hashtag",
  "places",
  "google",
  "similar",
  "manual",
  "inbound",
];

/**
 * POST /api/admin/outreach/import
 *
 * The single door into the prospect list. Every discovery lane comes through
 * here so dedupe is decided in exactly one place:
 *   - the panel's paste box (session-authed, sends `blob`)
 *   - the browser-assisted hashtag/similar-accounts sweep (sends `prospects`)
 *   - the Google Places studio sweep
 *   - the Google-operator sweep
 *
 * Body: { source, sourceDetail?, territoryId?, blob? , prospects?: [...] }
 * Either `blob` (free text — handles are extracted from it) or `prospects`
 * (structured, when the lane also collected bio/followers/city).
 *
 * Auth: admin session, or `Authorization: Bearer ${CRON_SECRET}` for the
 * scripted sweep lanes, which have no session cookie.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrSecret(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    const source: ProspectSource = SOURCES.includes(body.source)
      ? body.source
      : "manual";
    const sourceDetail =
      typeof body.sourceDetail === "string"
        ? body.sourceDetail.slice(0, 500)
        : null;
    const territoryId =
      typeof body.territoryId === "string" && body.territoryId ? body.territoryId : null;

    let prospects: ProspectInput[] = [];
    let invalidFromBlob: string[] = [];

    if (typeof body.blob === "string" && body.blob.trim()) {
      if (body.blob.length > MAX_BLOB_CHARS) {
        return NextResponse.json({ error: "blob too large" }, { status: 413 });
      }
      const { handles, invalid } = extractHandles(body.blob);
      // A pasted batch carries no structure of its own — if the founder picked
      // a city, stamp its geography on every handle so manually collected
      // prospects are as organised as swept ones.
      let city: string | null = null;
      let country: string | null = null;
      if (territoryId) {
        const { data: territory } = await getServiceRoleClient()
          .from("outreach_territories")
          .select("city,country")
          .eq("id", territoryId)
          .maybeSingle();
        city = (territory?.city as string | null) ?? null;
        country = (territory?.country as string | null) ?? null;
      }
      prospects = handles.map((handle) => ({ handle, city, country }));
      invalidFromBlob = invalid;
    } else if (Array.isArray(body.prospects)) {
      prospects = body.prospects
        .filter((p: unknown) => p && typeof (p as ProspectInput).handle === "string")
        .map((p: ProspectInput) => ({
          handle: p.handle,
          displayName: str(p.displayName, 200),
          profileUrl: str(p.profileUrl, 500),
          bio: str(p.bio, 2000),
          externalLink: str(p.externalLink, 500),
          followers:
            typeof p.followers === "number" && Number.isFinite(p.followers)
              ? Math.max(0, Math.round(p.followers))
              : null,
          discipline: str(p.discipline, 60),
          language: str(p.language, 10),
          city: str(p.city, 120),
          country: str(p.country, 2),
        }));
    } else {
      return NextResponse.json(
        { error: "send either blob or prospects" },
        { status: 400 }
      );
    }

    if (prospects.length > MAX_PROSPECTS) {
      return NextResponse.json(
        { error: `too many prospects (max ${MAX_PROSPECTS})` },
        { status: 413 }
      );
    }

    const result = await importProspects(getServiceRoleClient(), {
      source,
      sourceDetail,
      territoryId,
      prospects,
    });

    return NextResponse.json({
      ...result,
      // Junk lines from a pasted blob never reach importProspects (they aren't
      // handle-shaped), so fold them into the same "rejected" number the
      // founder sees.
      rejected: [...result.rejected, ...invalidFromBlob],
    });
  } catch (e) {
    console.error("Outreach import failed:", e);
    return NextResponse.json({ error: "import failed" }, { status: 500 });
  }
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}
