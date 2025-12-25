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

    // Check Cloudflare environment variables
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
      console.error("Missing Cloudflare credentials");
      return NextResponse.json(
        { error: "Cloudflare not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create Cloudflare live input
    let cloudflare;
    try {
      cloudflare = await createLiveInput(data.title);

      // Validate Cloudflare response
      if (!cloudflare.webrtcUrl || !cloudflare.streamId) {
        console.error("Invalid Cloudflare response:", cloudflare);
        throw new Error("Cloudflare returned invalid data - missing webrtcUrl or streamId");
      }

      console.log("Cloudflare live input created:", {
        streamId: cloudflare.streamId,
        hasWebrtcUrl: !!cloudflare.webrtcUrl,
        hasToken: !!cloudflare.webrtcToken,
        hasWhepUrl: !!cloudflare.whepPlaybackUrl,
      });
    } catch (cloudflareError: any) {
      console.error("Cloudflare API error:", cloudflareError);
      return NextResponse.json(
        { error: `Cloudflare error: ${cloudflareError.message || "Failed to create live input"}` },
        { status: 500 }
      );
    }

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
        cloudflare_whep_playback_url: cloudflare.whepPlaybackUrl,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message || "Failed to save stream"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ streamId: stream.id, success: true });
  } catch (error: any) {
    console.error("Stream creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create stream" },
      { status: 500 }
    );
  }
}
