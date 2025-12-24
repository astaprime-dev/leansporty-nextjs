// Database types for Supabase tables

export interface Workout {
  id: string;
  created_at: string;
  videoUrl: string | null;
  title: string | null;
  durationInSec: number | null;
  thumbnailUrl: string | null;
  calories: number;
  moves: number;
  subtitle: string;
  description: string;
  featured: boolean;
}

export interface WorkoutSession {
  id: string;
  user_id: string | null;
  workout_id: string | null;
  workout_date: string | null;
  calories_burned: number | null;
  created_at: string;
  duration_seconds: number;
  completed_at: string | null;
  last_playback_position: number | null;
}

// Type for joined query result
export interface WorkoutHistoryItem extends WorkoutSession {
  workouts: Workout | null;
}
