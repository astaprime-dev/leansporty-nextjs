import { getWorkoutHistory, getStreams, getUserEnrollments } from "@/app/actions";
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

  // Fetch upcoming streams
  const streams = await getStreams({ enrolledStreamIds });

  return (
    <ActivityView
      workoutHistory={workoutHistory}
      upcomingStreams={streams.upcomingStreams}
      liveStreams={streams.liveStreams}
      enrollments={enrollments}
      isAuthenticated={!!user}
    />
  );
}
