"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upsert the caller's review of a program (one per buyer; RLS enforces the
 * live-entitlement requirement, so no service role here). Public — feeds the
 * sales-page rating summary.
 */
export async function submitProgramReview(
  productId: string,
  rating: number,
  commentText: string,
  revalidate: string
): Promise<{ success: boolean; error?: string }> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "invalid rating" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "unauthorized" };

  const { error } = await supabase.from("program_reviews").upsert(
    {
      product_id: productId,
      user_id: user.id,
      rating,
      comment_text: commentText.trim().slice(0, 2000) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,user_id" }
  );
  if (error) {
    console.error("submitProgramReview failed:", error);
    return { success: false, error: "could not save review" };
  }

  if (revalidate.startsWith("/") && !revalidate.startsWith("//")) {
    revalidatePath(revalidate);
  }
  return { success: true };
}

/**
 * Upsert the caller's private per-lesson feedback (thumbs + optional note).
 * Visible only to the author and the program's instructor (RLS).
 */
export async function submitLessonFeedback(
  productId: string,
  contentId: string,
  sentiment: "up" | "down",
  commentText: string,
  revalidate: string
): Promise<{ success: boolean; error?: string }> {
  if (sentiment !== "up" && sentiment !== "down") {
    return { success: false, error: "invalid sentiment" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "unauthorized" };

  const { error } = await supabase.from("program_lesson_feedback").upsert(
    {
      product_id: productId,
      content_id: contentId,
      user_id: user.id,
      sentiment,
      comment_text: commentText.trim().slice(0, 1000) || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,content_id,user_id" }
  );
  if (error) {
    console.error("submitLessonFeedback failed:", error);
    return { success: false, error: "could not save feedback" };
  }

  if (revalidate.startsWith("/") && !revalidate.startsWith("//")) {
    revalidatePath(revalidate);
  }
  return { success: true };
}
