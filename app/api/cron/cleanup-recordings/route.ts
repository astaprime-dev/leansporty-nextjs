import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { deleteVideo } from "@/lib/cloudflare-stream";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Find all streams with expired recordings
    const { data: expiredStreams, error: fetchError } = await supabase
      .from("live_stream_sessions")
      .select("id, cloudflare_stream_id, title")
      .eq("recording_available", true)
      .not("recording_expires_at", "is", null)
      .lt("recording_expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired streams:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch expired streams" },
        { status: 500 }
      );
    }

    if (!expiredStreams || expiredStreams.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired recordings to clean up",
        cleaned: 0,
      });
    }

    const results = {
      cleaned: 0,
      failed: [] as string[],
    };

    // Delete each expired recording from Cloudflare
    for (const stream of expiredStreams) {
      try {
        if (stream.cloudflare_stream_id) {
          await deleteVideo(stream.cloudflare_stream_id);
        }

        // Update database to mark recording as unavailable
        const { error: updateError } = await supabase
          .from("live_stream_sessions")
          .update({
            recording_available: false,
            recording_cloudflare_video_id: null,
          })
          .eq("id", stream.id);

        if (updateError) {
          console.error(`Failed to update stream ${stream.id}:`, updateError);
          results.failed.push(stream.id);
        } else {
          results.cleaned++;
          console.log(`Cleaned up recording for stream: ${stream.title} (${stream.id})`);
        }
      } catch (error) {
        console.error(`Error cleaning up stream ${stream.id}:`, error);
        results.failed.push(stream.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${results.cleaned} expired recordings`,
      cleaned: results.cleaned,
      failed: results.failed.length > 0 ? results.failed : undefined,
    });
  } catch (error) {
    console.error("Cleanup cron job error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
