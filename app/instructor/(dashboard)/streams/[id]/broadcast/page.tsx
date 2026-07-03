import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveStreamSession, StreamIngest } from "@/types/streaming";
import { BroadcastManagementView } from "@/components/instructor/broadcast-management-view";

export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Resolve the caller's instructor id and scope the stream fetch to it. Without
  // this ownership filter any instructor could open another's broadcast view and
  // read their ingest secrets. (The dashboard layout already gates on being an
  // instructor; this scopes to the OWNING instructor.)
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructorProfile) {
    redirect("/instructor/streams");
  }

  const { data: stream, error } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", instructorProfile.id)
    .single();

  if (error || !stream) {
    redirect("/instructor/streams");
  }

  // Ingest secrets live in the owner-only table; RLS already restricts this to the
  // owning instructor, and we've confirmed ownership above.
  const { data: ingest } = await supabase
    .from("live_stream_ingest")
    .select("stream_id, rtmps_url, rtmps_stream_key, webrtc_url, webrtc_token")
    .eq("stream_id", id)
    .single();

  return (
    <BroadcastManagementView
      stream={stream as LiveStreamSession}
      ingest={(ingest as StreamIngest) ?? null}
    />
  );
}
