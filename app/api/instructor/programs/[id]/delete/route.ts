import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { deleteVideo } from "@/lib/cloudflare-stream";
import { programHasSales } from "@/lib/programs";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/delete
 *
 * Hard delete, only while the program has ZERO sales — once anyone has bought,
 * buyers keep their content (unpublish instead). Direct-upload lesson videos
 * (and their workouts rows) are cleaned up; reused class recordings are left
 * alone (they belong to the general catalog).
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
    const { program } = auth.ctx;

    if (await programHasSales(program.id)) {
      return NextResponse.json(
        {
          error:
            "This program has sales, so it can't be deleted — your students keep access to what they bought. You can unpublish it instead.",
        },
        { status: 409 }
      );
    }

    const db = getServiceRoleClient();

    // Direct uploads owned by this program: delete the Cloudflare videos and
    // their workouts rows. (Reused recordings have no program_uploads row.)
    const { data: uploads } = await db
      .from("program_uploads")
      .select("cloudflare_uid, workout_id")
      .eq("product_id", program.id);

    for (const u of uploads ?? []) {
      await deleteVideo(u.cloudflare_uid); // best-effort; logs internally
    }
    const workoutIds = (uploads ?? [])
      .map((u) => u.workout_id)
      .filter((w): w is string => !!w);
    if (workoutIds.length > 0) {
      await db.from("workouts").delete().in("id", workoutIds);
    }

    // product_items and program_uploads cascade from the product delete.
    const { error } = await db.from("products").delete().eq("id", program.id);
    if (error) {
      console.error("Program delete failed:", error);
      return NextResponse.json(
        { error: "Failed to delete. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Program delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete. Please try again." },
      { status: 500 }
    );
  }
}
