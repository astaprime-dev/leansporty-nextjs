import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { PROGRAM_PRICE_MIN_CENTS, PROGRAM_PRICE_MAX_CENTS } from "@/lib/programs";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/publish  { termsAccepted: true }
 *
 * Self-serve go-live. Requirements:
 * - at least one ready lesson (a product_items row),
 * - a sellable price,
 * - the rights warranty accepted (stored with a timestamp),
 * - not disabled by LeanSporty (admin_disabled is the founder kill-switch —
 *   while set, the instructor cannot re-activate).
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
    const { program } = auth.ctx;

    if (program.admin_disabled) {
      return NextResponse.json(
        { error: "This program was disabled by LeanSporty. Please contact us." },
        { status: 403 }
      );
    }

    const data = await request.json().catch(() => null);
    if (data?.termsAccepted !== true) {
      return NextResponse.json(
        { error: "Please confirm you have the rights to all content and music." },
        { status: 400 }
      );
    }

    if (
      program.price_cents < PROGRAM_PRICE_MIN_CENTS ||
      program.price_cents > PROGRAM_PRICE_MAX_CENTS
    ) {
      return NextResponse.json(
        { error: "Set a price between €0.50 and €500 before publishing." },
        { status: 400 }
      );
    }

    const db = getServiceRoleClient();
    const { count } = await db
      .from("product_items")
      .select("content_id", { count: "exact", head: true })
      .eq("product_id", program.id);
    if ((count ?? 0) < 1) {
      return NextResponse.json(
        { error: "Add at least one lesson before publishing." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("products")
      .update({
        is_active: true,
        published_at: program.published_at ?? new Date().toISOString(),
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", program.id);
    if (error) {
      console.error("Program publish failed:", error);
      return NextResponse.json(
        { error: "Failed to publish. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, slug: program.slug });
  } catch (error) {
    console.error("Program publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish. Please try again." },
      { status: 500 }
    );
  }
}
