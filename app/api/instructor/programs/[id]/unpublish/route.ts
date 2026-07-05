import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/unpublish
 *
 * Always allowed. Takes the program off sale (checkout rejects inactive
 * products; public pages hide it) — existing buyers keep access because the
 * playback gate checks entitlements, not is_active.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getOwnedProgram(id);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getServiceRoleClient();
    const { error } = await db
      .from("products")
      .update({ is_active: false })
      .eq("id", auth.ctx.program.id);
    if (error) {
      console.error("Program unpublish failed:", error);
      return NextResponse.json(
        { error: "Failed to unpublish. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Program unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish. Please try again." },
      { status: 500 }
    );
  }
}
