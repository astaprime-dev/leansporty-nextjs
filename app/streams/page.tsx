import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamsView } from "@/components/streams-view";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export default async function StreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  // Check auth status
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user enrollments (to badge cards) and the shared catalog
  const enrollments = await getUserEnrollments();
  const streams = await getStreams();

  return (
    <StreamsView
      liveStreams={streams.liveStreams}
      upcomingStreams={streams.upcomingStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
      notice={notice}
    />
  );
}
