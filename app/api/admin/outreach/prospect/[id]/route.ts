import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import {
  nextTouchAfter,
  PROSPECT_STATUSES,
  type ProspectStatus,
} from "@/lib/outreach";
import type { TouchNumber } from "@/lib/outreach-templates";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/outreach/prospect/[id]
 *
 * The one write path the queue uses. Body may carry any of:
 *   specificThing — the {specific_thing} personalization slot
 *   notes         — free text
 *   status        — an explicit move ("replied", "passed", …)
 *   markTouch     — 1|2|3: record that this touch was just sent by hand
 *
 * markTouch is the interesting one: it stamps t{n}_at, schedules the next touch
 * (+3 days after T1, +4 after T2, nothing after T3 — the sequence ends there),
 * and moves the prospect to 'contacted'. It does NOT send anything — Meta
 * forbids cold DM automation, so the founder taps send and then taps this.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }

    const db = getServiceRoleClient();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.specificThing === "string") {
      patch.specific_thing = body.specificThing.trim().slice(0, 500) || null;
    }
    // A pasted handle carries no name, and Touch 1 opens with one — so the
    // panel has to be able to set it.
    if (typeof body.displayName === "string") {
      patch.display_name = body.displayName.trim().slice(0, 200) || null;
    }
    if (typeof body.notes === "string") {
      patch.notes = body.notes.trim().slice(0, 2000) || null;
    }

    if (body.markTouch !== undefined) {
      const n = Number(body.markTouch) as TouchNumber;
      if (![1, 2, 3].includes(n)) {
        return NextResponse.json({ error: "invalid touch" }, { status: 400 });
      }
      const now = new Date();
      patch[`t${n}_at`] = now.toISOString();
      patch.next_touch_at = nextTouchAfter(n, now);
      // Touch 3 goes out with an invite link, so the prospect is already
      // 'invited' by then — don't walk her back to 'contacted'.
      if (n < 3) patch.status = "contacted";
    }

    if (typeof body.status === "string") {
      if (!PROSPECT_STATUSES.includes(body.status as ProspectStatus)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      patch.status = body.status;
      // A prospect who replied, passed, or activated is out of the drip — stop
      // surfacing her in the due queue.
      if (["replied", "passed", "activated", "rejected"].includes(body.status)) {
        patch.next_touch_at = null;
      }
    }

    const { data, error } = await db
      .from("outreach_prospects")
      .update(patch)
      .eq("id", id)
      .select(
        "id,status,display_name,specific_thing,notes,t1_at,t2_at,t3_at,next_touch_at"
      )
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ prospect: data });
  } catch (e) {
    console.error("Outreach prospect update failed:", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
