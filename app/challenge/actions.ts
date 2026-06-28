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
  completed: boolean
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

  revalidatePath("/my-program");
  return { success: true };
}
