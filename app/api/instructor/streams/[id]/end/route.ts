import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStreamRecordings } from "@/lib/cloudflare-stream";

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

    // Fetch stream to get cloudflare_stream_id
    const { data: stream } = await supabase
      .from("live_stream_sessions")
      .select("cloudflare_stream_id")
      .eq("id", id)
      .single();

    if (!stream?.cloudflare_stream_id) {
      console.error("Stream missing cloudflare_stream_id");
      return NextResponse.json(
        { error: "Stream configuration error" },
        { status: 500 }
      );
    }

    // Try to fetch recording from Cloudflare
    let recordingId: string | null = null;
    let recordingAvailable = false;

    try {
      const recordings = await getStreamRecordings(stream.cloudflare_stream_id);
      if (recordings.length > 0) {
        // Get the most recent recording (should only be one per stream)
        const recording = recordings[0];
        if (recording.uid && recording.readyToStream) {
          recordingId = recording.uid;
          recordingAvailable = true;
          console.log(`Recording found for stream ${id}:`, recordingId);
        } else {
          console.log(`Recording exists but not ready yet for stream ${id}`);
        }
      } else {
        console.log(`No recordings found yet for stream ${id} - will be processed by cron job`);
      }
    } catch (cfError) {
      console.error("Error fetching recording from Cloudflare:", cfError);
      // Continue anyway - cron job will pick it up later
    }

    // Update stream status to 'ended'
    // The trigger will automatically set recording_expires_at and migration_scheduled_at
    const { error } = await supabase
      .from("live_stream_sessions")
      .update({
        status: "ended",
        actual_end_time: new Date().toISOString(),
        recording_available: recordingAvailable,
        recording_cloudflare_video_id: recordingId,
      })
      .eq("id", id);

    if (error) {
      console.error("Error ending stream:", error);
      return NextResponse.json(
        { error: "Failed to end stream" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recordingAvailable,
      recordingId,
    });
  } catch (error) {
    console.error("End stream error:", error);
    return NextResponse.json(
      { error: "Failed to end stream" },
      { status: 500 }
    );
  }
}
