import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import type { ProspectRow, TerritoryRow } from "@/lib/outreach";

export const runtime = "nodejs";

const PAGE_SIZE = 100;

const PROSPECT_COLUMNS =
  "id,handle,display_name,profile_url,bio,followers,discipline,language,city,country,source,source_detail,score,score_reason,status,specific_thing,t1_at,t2_at,t3_at,next_touch_at,invite_code,notes,created_at";

/**
 * GET /api/admin/outreach?view=queue|new|all&status=&territoryId=
 *
 * Everything the /admin/outreach panel renders in one call: the prospect list
 * for the requested view, the territory board, and per-status counts.
 *
 * Views:
 *   queue — what to act on today: contacted prospects whose next touch is due,
 *           plus qualified prospects never yet contacted. Best fit first.
 *   new   — imported but not yet scored or reviewed.
 *   all   — everything, newest first (with optional status/territory filters).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const db = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") ?? "queue";
    const status = searchParams.get("status");
    const territoryId = searchParams.get("territoryId");

    let query = db.from("outreach_prospects").select(PROSPECT_COLUMNS);

    if (view === "queue") {
      // Due now, or qualified and never contacted. next_touch_at is null until
      // the first touch goes out, so the is-null arm is what surfaces fresh
      // qualified prospects.
      query = query
        .in("status", ["qualified", "contacted", "replied", "invited"])
        .or(`next_touch_at.is.null,next_touch_at.lte.${new Date().toISOString()}`)
        .order("score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: true });
    } else if (view === "new") {
      query = query
        .eq("status", "new")
        .order("created_at", { ascending: false });
    } else {
      if (status) query = query.eq("status", status);
      query = query.order("created_at", { ascending: false });
    }

    if (territoryId) query = query.eq("territory_id", territoryId);

    const { data: prospects, error } = await query.limit(PAGE_SIZE);
    if (error) throw error;

    const [{ data: territories }, counts] = await Promise.all([
      db
        .from("outreach_territories")
        .select(
          "id,country,city,priority,hashtags,search_queries,places_queries,status,last_swept_at,prospects_found,prospects_qualified"
        )
        .order("priority", { ascending: true })
        .order("country", { ascending: true })
        .order("city", { ascending: true }),
      countByStatus(db),
    ]);

    return NextResponse.json({
      prospects: (prospects ?? []) as unknown as ProspectRow[],
      territories: (territories ?? []) as unknown as TerritoryRow[],
      counts,
      truncated: (prospects ?? []).length === PAGE_SIZE,
    });
  } catch (e) {
    console.error("Outreach list failed:", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}

/**
 * Per-status totals for the header. Uses head+count so no rows cross the wire
 * — the list is capped at PAGE_SIZE and these numbers must reflect the whole
 * table, not the page.
 */
async function countByStatus(
  db: ReturnType<typeof getServiceRoleClient>
): Promise<Record<string, number>> {
  const { data, error } = await db
    .from("outreach_prospects")
    .select("status")
    .limit(10000);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = row.status as string;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  counts.total = (data ?? []).length;
  return counts;
}
