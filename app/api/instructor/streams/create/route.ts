import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createLiveInput } from "@/lib/cloudflare-stream";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Check instructor authentication
    const cookieStore = await cookies();
    const instructorToken = cookieStore.get("instructor_token");

    if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Create Cloudflare live input
    const cloudflare = await createLiveInput(data.title);

    // Create stream session in database
    const supabase = await createClient();
    const { data: stream, error } = await supabase
      .from("live_stream_sessions")
      .insert({
        title: data.title,
        description: data.description,
        instructor_name: data.instructorName,
        scheduled_start_time: data.scheduledStartTime,
        scheduled_duration_seconds: data.durationMinutes * 60,
        price_in_tokens: data.priceInTokens,
        cloudflare_stream_id: cloudflare.streamId,
        cloudflare_webrtc_url: cloudflare.webrtcUrl,
        cloudflare_webrtc_token: cloudflare.webrtcToken,
        cloudflare_playback_id: cloudflare.playbackId,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({ streamId: stream.id, success: true });
  } catch (error) {
    console.error("Stream creation error:", error);
    return NextResponse.json(
      { error: "Failed to create stream" },
      { status: 500 }
    );
  }
}
