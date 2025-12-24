import { getWorkouts } from "@/app/actions";
import Image from "next/image";

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();

  // Helper function to format duration from seconds to MM:SS
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
          Latest Dance Workouts
        </h1>
        <p className="text-muted-foreground">Choose a workout to get started</p>
      </div>

      {/* Workouts Grid */}
      {workouts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No workouts available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back soon for new dance workouts!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="group relative bg-white rounded-2xl border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-0 sm:gap-6">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-pink-50 to-rose-50">
                  {workout.thumbnailUrl ? (
                    <Image
                      src={workout.thumbnailUrl}
                      alt={workout.title || 'Workout'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 256px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">💃</span>
                    </div>
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                    {formatDuration(workout.durationInSeconds)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-pink-500 transition-colors">
                    {workout.title || 'Untitled Workout'}
                  </h2>

                  {workout.subtitle && (
                    <p className="text-gray-600 mb-4 text-lg">
                      {workout.subtitle}
                    </p>
                  )}

                  {workout.description && workout.description !== 'workout' && (
                    <p className="text-gray-500 mb-4">
                      {workout.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {workout.calories > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-pink-500">🔥</span>
                        <span>{workout.calories} cal</span>
                      </div>
                    )}
                    {workout.moves > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-pink-500">💫</span>
                        <span>{workout.moves} moves</span>
                      </div>
                    )}
                  </div>

                  {/* Featured Badge */}
                  {workout.featured && (
                    <div className="mt-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-semibold rounded-full">
                        ⭐ Featured
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
