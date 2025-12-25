import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check instructor authentication
    const cookieStore = await cookies();
    const instructorToken = cookieStore.get("instructor_token");

    if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Update stream status to 'ended'
    // The trigger will automatically set recording_expires_at and migration_scheduled_at
    const { error } = await supabase
      .from("live_stream_sessions")
      .update({
        status: "ended",
        actual_end_time: new Date().toISOString(),
        recording_available: true, // Recording will be available after Cloudflare processes it
      })
      .eq("id", params.id);

    if (error) {
      console.error("Error ending stream:", error);
      return NextResponse.json(
        { error: "Failed to end stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End stream error:", error);
    return NextResponse.json(
      { error: "Failed to end stream" },
      { status: 500 }
    );
  }
}
