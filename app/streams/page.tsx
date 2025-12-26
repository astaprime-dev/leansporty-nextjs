import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamsView } from "@/components/streams-view";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export default async function StreamsPage() {
  // Check auth status
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user enrollments first
  const enrollments = await getUserEnrollments();

  // Extract enrolled stream IDs
  const enrolledStreamIds = enrollments.map(e => e.stream_id);

  // Fetch streams with enrollment context
  const streams = await getStreams({ enrolledStreamIds });

  return (
    <StreamsView
      liveStreams={streams.liveStreams}
      upcomingStreams={streams.upcomingStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
    />
  );
}
