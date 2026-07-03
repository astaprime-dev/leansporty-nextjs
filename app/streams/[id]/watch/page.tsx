import { checkStreamEnrollment, getStreamById } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StreamWatchView } from "@/components/stream-watch-view";
import { FinalizingAccess } from "@/components/challenge/cta";
import { getStreamRecordings } from "@/lib/cloudflare-stream";

export default async function StreamWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { id: streamId } = await params;
  const { purchased } = await searchParams;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in — send to the classes list with a clear reason, not home.
    redirect("/streams?notice=signin");
  }

  // Get stream details first — we need product_id to tell free from paid.
  let stream = await getStreamById(streamId);

  if (!stream) {
    redirect("/streams?notice=notfound");
  }

  // Access = a roster row (stream_enrollments). For FREE classes users self-enroll;
  // for PAID classes only the Stripe webhook inserts the row (self-enroll is
  // RLS-blocked), so a roster row on a paid class is proof of purchase.
  const enrollment = await checkStreamEnrollment(streamId);

  if (!enrollment) {
    // Paid class, buyer just returned from Checkout → the webhook grants access
    // asynchronously. Poll for it instead of bouncing them to the catalog.
    if (stream.product_id && purchased) {
      const { data: prod } = await supabase
        .from("products")
        .select("slug")
        .eq("id", stream.product_id)
        .maybeSingle();
      if (prod?.slug) {
        return (
          <div className="max-w-md mx-auto px-4 py-24">
            <FinalizingAccess slug={prod.slug} />
          </div>
        );
      }
    }
    // Not enrolled — explain the redirect instead of bouncing silently.
    redirect("/streams?notice=enroll");
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
