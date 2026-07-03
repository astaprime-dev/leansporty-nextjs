import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteLiveInput } from "@/lib/cloudflare-stream";

/**
 * Cancel a SCHEDULED stream (Studio plan S1.4). Owner-scoped, scheduled-only:
 * a live or ended stream can't be cancelled (end it instead). The row is kept with
 * status='cancelled' so history/enrollees survive; the Cloudflare live input is
 * deleted best-effort so it stops consuming an ingest slot.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!instructorProfile) {
      return NextResponse.json({ error: "Not an instructor" }, { status: 403 });
    }

    const { id } = await params;

    const { data: stream } = await supabase
      .from("live_stream_sessions")
      .select("status, cloudflare_stream_id")
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id)
      .single();

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }
    if (stream.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only a scheduled stream can be cancelled." },
        { status: 409 }
      );
    }

    // Compare-and-set on status='scheduled' so a concurrent go-live can't be undone.
    const { data: updated, error } = await supabase
      .from("live_stream_sessions")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Could not cancel the stream. Please try again." },
        { status: 409 }
      );
    }

    // Free the Cloudflare live input (best-effort — the cancel already succeeded).
    if (stream.cloudflare_stream_id) {
      await deleteLiveInput(stream.cloudflare_stream_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel stream error:", error);
    return NextResponse.json(
      { error: "Failed to cancel stream. Please try again." },
      { status: 500 }
    );
  }
}
