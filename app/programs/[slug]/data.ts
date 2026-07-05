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
  grantedAt: string | null;
  expiresAt: string | null;
  completedContentIds: string[];
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
  let grantedAt: string | null = null;
  let expiresAt: string | null = null;
  let completedContentIds: string[] = [];

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
  }

  // Off-sale programs are visible only to their buyers.
  if ((!product.is_active || product.admin_disabled) && !owned) return null;

  // product_items → workouts is a to-one FK to public.workouts, so the nested
  // select is safe (the instructors/user_profiles ambiguity doesn't apply).
  // Never select cloudflare_uid.
  const { data: rawItems } = await supabase
    .from("product_items")
    .select(
      "product_id, content_id, position, day_number, is_preview, item_label, workout:workouts(id, title, subtitle, durationInSeconds, thumbnailUrl)"
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
    grantedAt,
    expiresAt,
    completedContentIds,
  };
}
