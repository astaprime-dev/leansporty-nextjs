import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check instructor authentication
    const cookieStore = await cookies();
    const instructorToken = cookieStore.get("instructor_token");

    if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
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
