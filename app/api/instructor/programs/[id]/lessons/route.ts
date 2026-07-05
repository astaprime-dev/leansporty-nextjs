import { NextRequest, NextResponse } from "next/server";
import { getOwnedProgram } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { PROGRAM_CAPS, programHasSales } from "@/lib/programs";

export const runtime = "nodejs";

/**
 * POST /api/instructor/programs/[id]/lessons  { workoutId, itemLabel? }
 * Adds an EXISTING workout (a recording of the instructor's own past class)
 * as a lesson. New uploads go through lessons/upload-url instead.
 *
 * DELETE /api/instructor/programs/[id]/lessons  { contentId }
 * Removes a lesson — blocked once the program has any sale (buyers keep what
 * they paid for). Direct-upload lessons also drop their workouts row +
 * Cloudflare video is left for the program delete path (removing a lesson
 * pre-sale keeps the upload reusable).
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
    const { program, instructorId } = auth.ctx;

    const data = await request.json().catch(() => null);
    const workoutId = typeof data?.workoutId === "string" ? data.workoutId : "";
    if (!workoutId) {
      return NextResponse.json({ error: "workoutId required" }, { status: 400 });
    }
    const itemLabel =
      typeof data?.itemLabel === "string" && data.itemLabel.trim()
        ? data.itemLabel.trim().slice(0, 255)
        : null;

    const db = getServiceRoleClient();

    // Cap: lessons per program.
    const { count } = await db
      .from("product_items")
      .select("content_id", { count: "exact", head: true })
      .eq("product_id", program.id);
    if ((count ?? 0) >= PROGRAM_CAPS.maxLessonsPerProgram) {
      return NextResponse.json(
        { error: `A program can have up to ${PROGRAM_CAPS.maxLessonsPerProgram} lessons.` },
        { status: 400 }
      );
    }

    // Ownership: the workout must be attributed to this instructor, or be the
    // migrated recording of one of their own streams (pre-attribution rows).
    const { data: workout } = await db
      .from("workouts")
      .select("id, instructor_id, cloudflare_uid")
      .eq("id", workoutId)
      .maybeSingle();
    if (!workout || !workout.cloudflare_uid) {
      return NextResponse.json({ error: "Recording not found." }, { status: 404 });
    }
    let owned = workout.instructor_id === instructorId;
    if (!owned) {
      const { data: sourceStream } = await db
        .from("live_stream_sessions")
        .select("id")
        .eq("migrated_to_workout_id", workoutId)
        .eq("instructor_id", instructorId)
        .maybeSingle();
      owned = !!sourceStream;
    }
    if (!owned) {
      return NextResponse.json(
        { error: "You can only add recordings of your own classes." },
        { status: 403 }
      );
    }

    // Next position (append).
    const { data: last } = await db
      .from("product_items")
      .select("position")
      .eq("product_id", program.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = (last?.position ?? 0) + 1;

    const { error } = await db.from("product_items").insert({
      product_id: program.id,
      content_id: workoutId,
      position,
      is_preview: false,
      item_label: itemLabel,
    });
    if (error) {
      const duplicate = error.code === "23505";
      return NextResponse.json(
        {
          error: duplicate
            ? "That recording is already in this program."
            : "Failed to add the lesson. Please try again.",
        },
        { status: duplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ success: true, position });
  } catch (error) {
    console.error("Add lesson error:", error);
    return NextResponse.json(
      { error: "Failed to add the lesson. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const contentId = typeof data?.contentId === "string" ? data.contentId : "";
    if (!contentId) {
      return NextResponse.json({ error: "contentId required" }, { status: 400 });
    }

    if (await programHasSales(program.id)) {
      return NextResponse.json(
        {
          error:
            "This program has sales, so lessons can't be removed — your students keep access to what they bought.",
        },
        { status: 409 }
      );
    }

    const db = getServiceRoleClient();
    const { error } = await db
      .from("product_items")
      .delete()
      .eq("product_id", program.id)
      .eq("content_id", contentId);
    if (error) {
      console.error("Lesson remove failed:", error);
      return NextResponse.json(
        { error: "Failed to remove the lesson. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lesson remove error:", error);
    return NextResponse.json(
      { error: "Failed to remove the lesson. Please try again." },
      { status: 500 }
    );
  }
}
