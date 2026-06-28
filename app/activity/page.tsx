import { getWorkoutHistory, getStreams, getUserEnrollments, getPastStreams } from "@/app/actions";
import { ActivityView } from "@/components/activity-view";
import { ProgramCard } from "@/components/challenge/program-card";
import { createClient } from "@/utils/supabase/server";
import type { WorkoutHistoryItem } from "@/types/database";

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch workout history and stream data in parallel
  const [workoutHistory, enrollments] = await Promise.all([
    getWorkoutHistory(),
    getUserEnrollments(),
  ]);

  // Web challenge completions (workout_progress) → same shape as iOS history,
  // so a web user's program effort shows up in Activity (it isn't in
  // workout_sessions). No calories: web has no weight (tracked on iOS only).
  let programSessions: WorkoutHistoryItem[] = [];
  if (user) {
    const { data: progress } = await supabase
      .from("workout_progress")
      .select(
        'workout_id, completed_at, last_position_seconds, workouts(id, created_at, "videoUrl", title, "durationInSeconds", "thumbnailUrl", calories, moves, subtitle, description, featured)'
      )
      .not("completed_at", "is", null);
    programSessions = (progress ?? []).map((p: any) => ({
      id: `wp-${p.workout_id}`,
      user_id: user.id,
      workout_id: p.workout_id,
      workout_date: p.completed_at,
      calories_burned: null,
      created_at: p.completed_at,
      duration_seconds: Number(p.workouts?.durationInSeconds ?? 0),
      completed_at: p.completed_at,
      last_playback_position: p.last_position_seconds,
      workouts: p.workouts ?? null,
    }));
  }
  const combinedHistory: WorkoutHistoryItem[] = [
    ...workoutHistory,
    ...programSessions,
  ];

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
        workoutHistory={combinedHistory}
        upcomingStreams={streams.upcomingStreams}
        liveStreams={streams.liveStreams}
        pastStreams={pastStreams}
        enrollments={enrollments}
        isAuthenticated={!!user}
      />
    </>
  );
}
