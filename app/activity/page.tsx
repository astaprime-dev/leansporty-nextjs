import { getWorkoutHistory } from "@/app/actions";

export default async function ActivityPage() {
  const workoutHistory = await getWorkoutHistory();

  // Helper function to format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 py-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Activity</h1>
        <p className="text-muted-foreground">Your workout history and progress</p>
      </div>

      {workoutHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No workout sessions yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start your first workout to see your activity here!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold">Date</th>
                <th className="text-left py-4 px-4 font-semibold">Workout</th>
                <th className="text-left py-4 px-4 font-semibold">Duration</th>
                <th className="text-left py-4 px-4 font-semibold">Calories Burned</th>
              </tr>
            </thead>
            <tbody>
              {workoutHistory.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    {formatDate(session.workout_date)}
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {session.workouts?.title || 'Unknown Workout'}
                  </td>
                  <td className="py-4 px-4">
                    {formatDuration(session.duration_seconds)}
                  </td>
                  <td className="py-4 px-4">
                    {session.calories_burned || 0} kcal
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {workoutHistory.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Workouts</h3>
            <p className="text-3xl font-bold">{workoutHistory.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Duration</h3>
            <p className="text-3xl font-bold">
              {formatDuration(
                workoutHistory.reduce((total, session) => total + session.duration_seconds, 0)
              )}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Calories</h3>
            <p className="text-3xl font-bold">
              {workoutHistory.reduce((total, session) => total + (session.calories_burned || 0), 0)} kcal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
