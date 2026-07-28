import { NextRequest, NextResponse } from "next/server";
import { getInstructorContext } from "@/lib/program-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { deleteVideo } from "@/lib/cloudflare-stream";

export const runtime = "nodejs";

/**
 * DELETE /api/instructor/programs/lessons/[uid]
 *
 * Removes a stuck upload (tab closed mid-tus, or a Cloudflare error) so it
 * stops counting against the lesson/storage caps — previously these rows sat
 * in 'uploading' forever with no way to clear them. Only never-promoted rows
 * may be removed: 'processing' is refused (the status poller is about to
 * promote it — deleting would race the workouts insert), and promoted rows
 * are real lessons, removed via the program's lessons DELETE instead.
 *
 * This is also "cancel the new video" for a pending replacement. Those are
 * safe to cancel at any point before they're applied, including while
 * processing: there is no promotion to race, and the lesson is still playing
 * its current video regardless.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const auth = await getInstructorContext();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getServiceRoleClient();
    const { data: upload } = await db
      .from("program_uploads")
      .select("id, instructor_id, status, workout_id, replaces_workout_id")
      .eq("cloudflare_uid", uid)
      .maybeSingle();
    if (!upload || upload.instructor_id !== auth.instructorId) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }
    if (upload.workout_id) {
      return NextResponse.json(
        {
          error: upload.replaces_workout_id
            ? "This video is already in use. Go back to the old video first."
            : "This video is already a lesson — remove the lesson instead.",
        },
        { status: 409 }
      );
    }
    if (upload.status === "processing" && !upload.replaces_workout_id) {
      return NextResponse.json(
        { error: "This video is processing and will appear as a lesson shortly." },
        { status: 409 }
      );
    }

    // Reclaim the Cloudflare object too (partial tus uploads still hold a
    // video draft). Best-effort — the row delete is what frees the caps.
    await deleteVideo(uid);

    const { error } = await db
      .from("program_uploads")
      .delete()
      .eq("id", upload.id);
    if (error) {
      console.error("Stuck-upload delete failed:", error);
      return NextResponse.json(
        { error: "Failed to remove. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stuck-upload delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove. Please try again." },
      { status: 500 }
    );
  }
}
