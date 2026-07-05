import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * PATCH /api/instructor/programs/[id]/lessons/reorder
 * { items: [{ contentId, position, dayNumber?, isPreview?, itemLabel? }] }
 *
 * Bulk-updates ordering/day mapping/preview flags for the program's lessons.
 * Only rows belonging to this program are touched (update is scoped by
 * product_id); at most one lesson may be the free preview.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { program } = auth.ctx;

    const data = await request.json().catch(() => null);
    const items = Array.isArray(data?.items) ? data.items : null;
    if (!items || items.length === 0 || items.length > 100) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const previews = items.filter((it: { isPreview?: boolean }) => it?.isPreview === true);
    if (previews.length > 1) {
      return NextResponse.json(
        { error: "Only one lesson can be the free preview." },
        { status: 400 }
      );
    }

    const db = getServiceRoleClient();
    for (const it of items) {
      const contentId = typeof it?.contentId === "string" ? it.contentId : "";
      const position = Number(it?.position);
      if (!contentId || !Number.isInteger(position) || position < 1) {
        return NextResponse.json({ error: "Invalid item" }, { status: 400 });
      }
      const patch: Record<string, unknown> = { position };
      if (it.dayNumber !== undefined) {
        const day = it.dayNumber === null ? null : Number(it.dayNumber);
        if (day !== null && (!Number.isInteger(day) || day < 1 || day > 90)) {
          return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
        }
        patch.day_number = day;
      }
      if (it.isPreview !== undefined) {
        patch.is_preview = it.isPreview === true;
      }
      if (it.itemLabel !== undefined) {
        patch.item_label =
          typeof it.itemLabel === "string" && it.itemLabel.trim()
            ? it.itemLabel.trim().slice(0, 255)
            : null;
      }

      const { error } = await db
        .from("product_items")
        .update(patch)
        .eq("product_id", program.id)
        .eq("content_id", contentId);
      if (error) {
        console.error("Lesson reorder failed:", error);
        return NextResponse.json(
          { error: "Failed to save the order. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson reorder error:", error);
    return NextResponse.json(
      { error: "Failed to save the order. Please try again." },
      { status: 500 }
    );
  }
}
