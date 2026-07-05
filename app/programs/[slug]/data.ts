// Server-only data access for public program pages (/programs/[slug]).
// Modeled on app/challenge/data.ts, generalized to any instructor program
// (products.kind='course'). Uses the cookie-bound RLS client.

import { createClient } from "@/utils/supabase/server";
import type { Product, ProductItem } from "@/types/commerce";

export interface ProgramData {
  product: Product;
  items: ProductItem[];
  instructor: {
    slug: string | null;
    displayName: string | null;
    photoUrl: string | null;
  } | null;
  isAuthenticated: boolean;
  owned: boolean;
  /** The signed-in user is the program's instructor (self-preview allowed). */
  isOwnerInstructor: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
  completedContentIds: string[];
  /** Public social proof from program_reviews. */
  reviewSummary: { average: number; count: number } | null;
  /** The caller's own review, for prefilling the widget. */
  myReview: { rating: number; comment_text: string | null } | null;
}

/**
 * Fetch everything a program page needs. Visibility rule: a program that is
 * inactive or admin-disabled is only visible to buyers who already own it
 * (they keep access after an unpublish); everyone else gets null → 404.
 */
export async function getProgramData(slug: string): Promise<ProgramData | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("kind", "course")
    .maybeSingle();
  if (!product) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let owned = false;
  let isOwnerInstructor = false;
  let grantedAt: string | null = null;
  let expiresAt: string | null = null;
  let completedContentIds: string[] = [];
  let myReview: ProgramData["myReview"] = null;

  if (user) {
    const { data: ent } = await supabase
      .from("entitlements")
      .select("granted_at, expires_at")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();
    if (ent) {
      owned = true;
      grantedAt = ent.granted_at ?? null;
      expiresAt = ent.expires_at ?? null;
    }

    if (product.instructor_id) {
      const { data: ownInstructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", product.instructor_id)
        .maybeSingle();
      isOwnerInstructor = !!ownInstructor;
    }
  }

  // Off-sale programs are visible only to their buyers (and their instructor).
  if ((!product.is_active || product.admin_disabled) && !owned && !isOwnerInstructor) {
    return null;
  }

  // product_items → workouts is a to-one FK to public.workouts, so the nested
  // select is safe (the instructors/user_profiles ambiguity doesn't apply).
  // Never select cloudflare_uid.
  const { data: rawItems } = await supabase
    .from("product_items")
    .select(
      "product_id, content_id, position, day_number, is_preview, item_label, workout:workouts(id, title, subtitle, durationInSeconds, thumbnailUrl, description, calories, moves)"
    )
    .eq("product_id", product.id)
    .order("position", { ascending: true });

  const items: ProductItem[] = (rawItems ?? []).map((r: any) => ({
    product_id: r.product_id,
    content_id: r.content_id,
    position: r.position,
    day_number: r.day_number,
    is_preview: r.is_preview,
    item_label: r.item_label,
    workout: (Array.isArray(r.workout) ? r.workout[0] : r.workout) ?? null,
  }));

  if (user && owned) {
    const { data: progress } = await supabase
      .from("workout_progress")
      .select("workout_id, completed_at")
      .not("completed_at", "is", null);
    completedContentIds = (progress ?? []).map((p: any) => p.workout_id);

    const { data: review } = await supabase
      .from("program_reviews")
      .select("rating, comment_text")
      .eq("product_id", product.id)
      .eq("user_id", user.id)
      .maybeSingle();
    myReview = review ?? null;
  }

  // Public rating summary (RLS: visible reviews only).
  let reviewSummary: ProgramData["reviewSummary"] = null;
  const { data: ratings } = await supabase
    .from("program_reviews")
    .select("rating")
    .eq("product_id", product.id);
  if (ratings && ratings.length > 0) {
    const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    reviewSummary = {
      average: Math.round((sum / ratings.length) * 10) / 10,
      count: ratings.length,
    };
  }

  // Instructor byline: instructors (slug) + user_profiles (display) FK to
  // auth.users separately — fetch both and merge in code (repo convention).
  let instructor: ProgramData["instructor"] = null;
  if (product.instructor_id) {
    const { data: instr } = await supabase
      .from("instructors")
      .select("slug, user_id")
      .eq("id", product.instructor_id)
      .maybeSingle();
    if (instr) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, profile_photo_url")
        .eq("user_id", instr.user_id)
        .maybeSingle();
      instructor = {
        slug: instr.slug ?? null,
        displayName: profile?.display_name ?? null,
        photoUrl: profile?.profile_photo_url ?? null,
      };
    }
  }

  return {
    product: product as Product,
    items,
    instructor,
    isAuthenticated: !!user,
    owned,
    isOwnerInstructor,
    grantedAt,
    expiresAt,
    completedContentIds,
    reviewSummary,
    myReview,
  };
}
