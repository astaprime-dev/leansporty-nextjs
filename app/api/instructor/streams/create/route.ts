import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createLiveInput } from "@/lib/cloudflare-stream";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate scheduled time is in the future
    const scheduledDate = new Date(data.scheduledStartTime);
    const now = new Date();

    if (scheduledDate <= now) {
      return NextResponse.json(
        { error: "Scheduled start time must be in the future" },
        { status: 400 }
      );
    }

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

    // Get authenticated user and instructor profile
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get instructor profile
    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id, display_name")
      .eq("user_id", user.id)
      .single();

    if (!instructorProfile) {
      return NextResponse.json(
        { error: "Instructor profile not found. Please create your profile first." },
        { status: 400 }
      );
    }

    // Create stream session in database
    const { data: stream, error } = await supabase
      .from("live_stream_sessions")
      .insert({
        title: data.title,
        description: data.description,
        instructor_name: instructorProfile.display_name,
        instructor_id: instructorProfile.id,
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
