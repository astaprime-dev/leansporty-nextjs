import { getWorkoutHistory, getStreams, getUserEnrollments, getPastStreams } from "@/app/actions";
import { ActivityView } from "@/components/activity-view";
import { ProgramCard } from "@/components/challenge/program-card";
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
    <>
      {/* Surface the buyer's program first — activation/retention */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-6 sm:pt-8">
        <ProgramCard />
      </div>
      <ActivityView
        workoutHistory={workoutHistory}
        upcomingStreams={streams.upcomingStreams}
        liveStreams={streams.liveStreams}
        pastStreams={pastStreams}
        enrollments={enrollments}
        isAuthenticated={!!user}
      />
    </>
  );
}
