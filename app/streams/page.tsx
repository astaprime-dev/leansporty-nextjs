import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamsView } from "@/components/streams-view";

export default async function StreamsPage() {
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
    />
  );
}
