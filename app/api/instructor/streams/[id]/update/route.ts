import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get instructor profile
    const { data: instructorProfile, error: profileError } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !instructorProfile) {
      return NextResponse.json(
        { error: "Instructor profile not found" },
        { status: 403 }
      );
    }

    // Verify stream ownership and status
    const { data: existingStream, error: streamError } = await supabase
      .from("live_stream_sessions")
      .select("status")
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id)
      .single();

    if (streamError || !existingStream) {
      return NextResponse.json(
        { error: "Stream not found" },
        { status: 404 }
      );
    }

    // Only allow editing scheduled streams
    if (existingStream.status !== "scheduled") {
      return NextResponse.json(
        { error: "Can only edit scheduled streams" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      instructorName,
      scheduledStartTime,
      durationMinutes,
      priceInTokens,
    } = body;

    // Validate required fields
    if (!title || !instructorName || !scheduledStartTime || !durationMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert scheduled start time to ISO format
    const scheduledDate = new Date(scheduledStartTime);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled start time" },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const now = new Date();
    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: "Scheduled start time must be in the future" },
        { status: 400 }
      );
    }

    // Update stream in database
    const { error: updateError } = await supabase
      .from("live_stream_sessions")
      .update({
        title,
        description: description || null,
        instructor_name: instructorName,
        scheduled_start_time: scheduledDate.toISOString(),
        scheduled_duration_seconds: durationMinutes * 60,
        price_in_tokens: priceInTokens || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("instructor_id", instructorProfile.id);

    if (updateError) {
      console.error("Error updating stream:", updateError);
      return NextResponse.json(
        { error: "Failed to update stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamId: id,
    });
  } catch (error) {
    console.error("Error in update stream API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
