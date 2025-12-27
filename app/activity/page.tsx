import { getWorkoutHistory, getStreams, getUserEnrollments, getPastStreams } from "@/app/actions";
import { ActivityView } from "@/components/activity-view";
import { createClient } from "@/utils/supabase/server";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch workout history and stream data in parallel
  const [workoutHistory, enrollments] = await Promise.all([
    getWorkoutHistory(),
    getUserEnrollments(),
  ]);

  // Get enrolled stream IDs
  const enrolledStreamIds = enrollments.map(e => e.stream_id);

  // Fetch upcoming and past streams in parallel
  const [streams, pastStreams] = await Promise.all([
    getStreams({ enrolledStreamIds }),
    getPastStreams({ enrolledStreamIds }),
  ]);

  return (
    <ActivityView
      workoutHistory={workoutHistory}
      upcomingStreams={streams.upcomingStreams}
      liveStreams={streams.liveStreams}
      pastStreams={pastStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
    />
  );
}
