import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and has instructor profile
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

    // Update stream status to 'live'
    const { error } = await supabase
      .from("live_stream_sessions")
      .update({
        status: "live",
        actual_start_time: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error starting stream:", error);
      return NextResponse.json(
        { error: "Failed to start stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Start stream error:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}
