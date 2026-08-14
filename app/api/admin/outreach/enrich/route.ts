import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSecret } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { businessDiscovery, instagramConfigured } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH_SIZE = 40;
const POLITE_DELAY_MS = 250;

/**
 * POST /api/admin/outreach/enrich
 *
 * Fills in bio and follower count from Instagram Business Discovery for
 * prospects that arrived with only a handle — which is every prospect the
 * Places sweep and the paste box produce.
 *
 * This is what turns the scorer from guesswork into judgement: with her real
 * bio it can tell a dance-fitness instructor from a ballroom teacher, and with
 * a follower count it can finally check the 5k–50k criterion. Enriched rows get
 * scored_at cleared so the next scoring pass re-reads them against the better
 * evidence.
 *
 * Accounts we learn nothing about (personal rather than professional, private,
 * renamed) are marked as attempted in metadata so we don't ask Meta about them
 * again on every run — absence of data is not evidence against her.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrSecret(request);
  if (!auth.ok) return auth.response;

  if (!instagramConfigured()) {
    return NextResponse.json(
      {
        error:
          "Instagram Business Discovery is not configured — set IG_GRAPH_TOKEN and IG_USER_ID",
      },
      { status: 503 }
    );
  }

  try {
    const db = getServiceRoleClient();

    const { data: rows, error } = await db
      .from("outreach_prospects")
      .select("id,handle,metadata")
      .is("bio", null)
      .not("status", "in", "(activated,passed,invited)")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE * 3);
    if (error) throw error;

    // Skip the ones we've already asked Meta about and learned nothing.
    const todo = (rows ?? [])
      .filter(
        (r) => !(r.metadata as Record<string, unknown> | null)?.ig_lookup_failed
      )
      .slice(0, BATCH_SIZE);

    let enriched = 0;
    let notProfessional = 0;
    const now = new Date().toISOString();

    for (const row of todo) {
      const profile = await businessDiscovery(row.handle as string);
      const metadata = {
        ...((row.metadata as Record<string, unknown> | null) ?? {}),
      };

      if (!profile) {
        notProfessional += 1;
        metadata.ig_lookup_failed = true;
        await db
          .from("outreach_prospects")
          .update({ metadata, updated_at: now })
          .eq("id", row.id);
      } else {
        enriched += 1;
        metadata.ig_enriched_at = now;
        await db
          .from("outreach_prospects")
          .update({
            bio: profile.biography,
            followers: profile.followers,
            display_name: profile.name,
            external_link: profile.website,
            metadata,
            // Re-judge with the better evidence.
            scored_at: null,
            score: null,
            score_reason: null,
            updated_at: now,
          })
          .eq("id", row.id);
      }
      await sleep(POLITE_DELAY_MS);
    }

    return NextResponse.json({
      attempted: todo.length,
      enriched,
      // Personal (non-professional) accounts can't be read this way. That says
      // nothing about whether she's a fit — she just needs a human look.
      notProfessional,
      remaining: Math.max(0, (rows ?? []).length - todo.length),
    });
  } catch (e) {
    console.error("Outreach enrichment failed:", e);
    return NextResponse.json({ error: "enrichment failed" }, { status: 500 });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
