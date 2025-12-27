import { checkStreamEnrollment, getStreamById } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StreamWatchView } from "@/components/stream-watch-view";
import { getStreamRecordings } from "@/lib/cloudflare-stream";

export default async function StreamWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: streamId } = await params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check enrollment
  const enrollment = await checkStreamEnrollment(streamId);

  if (!enrollment) {
    redirect("/streams");
  }

  // Get stream details
  let stream = await getStreamById(streamId);

  if (!stream) {
    redirect("/streams");
  }

  // If stream is ended but recording is not available yet, try to fetch it from Cloudflare
  if (
    stream.status === "ended" &&
    !stream.recording_cloudflare_video_id &&
    stream.cloudflare_stream_id
  ) {
    console.log(`Checking Cloudflare for recording of stream ${streamId}`);

    try {
      const recordings = await getStreamRecordings(stream.cloudflare_stream_id);

      if (recordings.length > 0) {
        const recording = recordings[0];

        if (recording.uid && recording.readyToStream) {
          // Recording is ready - update database
          const { error: updateError } = await supabase
            .from("live_stream_sessions")
            .update({
              recording_available: true,
              recording_cloudflare_video_id: recording.uid,
            })
            .eq("id", streamId);

          if (!updateError) {
            // Refetch stream with updated recording info
            const updatedStream = await getStreamById(streamId);
            if (updatedStream) {
              stream = updatedStream;
            }
            console.log(`✓ Recording fetched and saved for stream ${streamId}: ${recording.uid}`);
          } else {
            console.error(`Error updating recording for stream ${streamId}:`, updateError);
          }
        } else {
          console.log(`Recording exists but not ready yet for stream ${streamId}`);
        }
      } else {
        console.log(`No recording found yet for stream ${streamId}`);
      }
    } catch (cfError) {
      console.error(`Error fetching recording from Cloudflare for stream ${streamId}:`, cfError);
      // Continue anyway - will show "not available" message
    }
  }

  // Check if current user is an instructor
  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return (
    <StreamWatchView
      stream={stream}
      enrollment={enrollment}
      isLive={stream.status === "live"}
      isInstructor={!!instructor}
      instructorId={instructor?.id}
    />
  );
}
