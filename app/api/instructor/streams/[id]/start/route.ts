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

    // Check current stream status to determine if this is a first start or reconnection
    const { data: stream, error: fetchError } = await supabase
      .from("live_stream_sessions")
      .select("status, actual_start_time")
      .eq("id", id)
      .single();

    if (fetchError || !stream) {
      console.error("Error fetching stream:", fetchError);
      return NextResponse.json(
        { error: "Stream not found" },
        { status: 404 }
      );
    }

    // Block restarting ended streams - instructor should create a new stream instead
    if (stream.status === "ended") {
      return NextResponse.json(
        { error: "This stream has already ended. Please create a new stream for your next class." },
        { status: 400 }
      );
    }

    // Prepare update data
    // Only set actual_start_time on first start, not on reconnection
    const updateData: { status: string; actual_start_time?: string } = {
      status: "live",
    };

    // If no start time exists, this is the first start (not a reconnection)
    if (!stream.actual_start_time) {
      updateData.actual_start_time = new Date().toISOString();
    }

    // Update stream status to 'live' (preserving start time on reconnection)
    const { error } = await supabase
      .from("live_stream_sessions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error starting stream:", error);
      return NextResponse.json(
        { error: "Failed to start stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isReconnection: !!stream.actual_start_time
    });
  } catch (error) {
    console.error("Start stream error:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}
