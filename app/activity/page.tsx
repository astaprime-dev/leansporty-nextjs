import { getWorkoutHistory } from "@/app/actions";
import { ActivityView } from "@/components/activity-view";

export default async function ActivityPage() {
  const workoutHistory = await getWorkoutHistory();

  return <ActivityView workoutHistory={workoutHistory} />;
}
