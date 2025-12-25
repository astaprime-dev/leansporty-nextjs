import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamsView } from "@/components/streams-view";
import { createClient } from "@/utils/supabase/server";

export default async function StreamsPage() {
  // Check auth status
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch streams and user enrollments in parallel
  const [streams, enrollments] = await Promise.all([
    getStreams(),
    getUserEnrollments(),
  ]);

  return (
    <StreamsView
      liveStreams={streams.liveStreams}
      upcomingStreams={streams.upcomingStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
    />
  );
}
