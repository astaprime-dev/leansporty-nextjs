import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/lessons/details
 * { contentId, styles?, calories?, description? }
 *
 * Updates the lesson's workout metadata shown on the watch page: dance styles
 * (stored comma-separated in workouts.subtitle), estimated calories, and the
 * lesson description. Note: workouts rows are shared — for a reused class
 * recording this also updates the catalog entry (instructor's own content,
 * same acceptance as the lesson thumbnail).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const data = await request.json().catch(() => null);
    const contentId = typeof data?.contentId === "string" ? data.contentId : "";
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if (data.styles !== undefined) {
      const styles = typeof data.styles === "string" ? data.styles.trim() : "";
      if (styles.length > 255) {
        return NextResponse.json(
          { error: "Styles must be 255 characters or fewer." },
          { status: 400 }
        );
      }
      // Normalize "a, b,,c" → "a, b, c"
      patch.subtitle =
        styles
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join(", ") || null;
    }

    if (data.calories !== undefined) {
      if (data.calories === null || data.calories === "") {
        patch.calories = null;
      } else {
        const calories = Number(data.calories);
        if (!Number.isInteger(calories) || calories < 0 || calories > 5000) {
          return NextResponse.json(
            { error: "Calories must be a whole number between 0 and 5000." },
            { status: 400 }
          );
        }
        patch.calories = calories;
      }
    }

    if (data.description !== undefined) {
      const description =
        typeof data.description === "string" ? data.description.trim() : "";
      if (description.length > 2000) {
        return NextResponse.json(
          { error: "Description must be 2000 characters or fewer." },
          { status: 400 }
        );
      }
      patch.description = description || null;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true });
    }

    // The lesson must belong to this program (which we own).
    const db = getServiceRoleClient();
    const { data: item } = await db
      .from("product_items")
      .select("content_id")
      .eq("product_id", auth.ctx.program.id)
      .eq("content_id", contentId)
      .maybeSingle();
    if (!item) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const { error } = await db.from("workouts").update(patch).eq("id", contentId);
    if (error) {
      console.error("Lesson details update failed:", error);
      return NextResponse.json(
        { error: "Failed to save. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson details error:", error);
    return NextResponse.json(
      { error: "Failed to save. Please try again." },
      { status: 500 }
    );
  }
}
