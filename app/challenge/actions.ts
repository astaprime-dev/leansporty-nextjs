"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mark a workout complete (or clear it) for the current user. Drives the
 * My Program grid + progress bar. Progress is cosmetic and own-row only (RLS);
 * MVP completion is the explicit "Mark complete" action (CHALLENGE §7).
 */
export async function setWorkoutComplete(
  workoutId: string,
  completed: boolean,
  /** Page to revalidate — the challenge default, or a program page. */
  revalidate: string = "/my-program"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "unauthorized" };

  const { error } = await supabase.from("workout_progress").upsert(
    {
      user_id: user.id,
      workout_id: workoutId,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,workout_id" }
  );

  if (error) {
    console.error("setWorkoutComplete failed:", error);
    return { success: false, error: "could not save progress" };
  }

  revalidatePath(
    revalidate.startsWith("/") && !revalidate.startsWith("//")
      ? revalidate
      : "/my-program"
  );
  return { success: true };
}

/**
 * Save the playback position for resume ("continue from 12:34"). Called
 * periodically from the watch page; deliberately does NOT revalidate any
 * path (it must never re-render the page mid-workout). Upsert only touches
 * last_position_seconds — completed_at is left alone.
 */
export async function savePlaybackPosition(
  workoutId: string,
  seconds: number
): Promise<{ success: boolean }> {
  if (!Number.isFinite(seconds) || seconds < 0) return { success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase.from("workout_progress").upsert(
    {
      user_id: user.id,
      workout_id: workoutId,
      last_position_seconds: Math.floor(seconds),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,workout_id" }
  );
  if (error) {
    console.error("savePlaybackPosition failed:", error);
    return { success: false };
  }
  return { success: true };
}
