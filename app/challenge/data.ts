// Server-only data access for the challenge surfaces (/challenge, /my-program).
// Imported by Server Components only — uses the cookie-bound RLS client, which
// relies on next/headers cookies() and therefore cannot run in a client component.

import { createClient } from "@/utils/supabase/server";
import { CHALLENGE_SLUG } from "@/lib/challenge";
import type { Product, ProductItem } from "@/types/commerce";

export interface ChallengeData {
  product: Product;
  items: ProductItem[];
  isAuthenticated: boolean;
  owned: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
  completedContentIds: string[];
  social: { average: number; count: number } | null;
}

/**
 * Fetch everything the challenge pages need: the product, its ordered items
 * (with the safe workout subset), and — when signed in — entitlement + progress.
 * Returns null if the product doesn't exist / is inactive.
 */
export async function getChallengeData(): Promise<ChallengeData | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", CHALLENGE_SLUG)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) return null;

  // product_items → workouts is a to-one FK to public.workouts (NOT auth.users),
  // so a nested select is safe here. Never select cloudflare_uid.
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
    workout: r.workout ?? null,
  }));

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

    const { data: progress } = await supabase
      .from("workout_progress")
      .select("workout_id, completed_at")
      .not("completed_at", "is", null);
    completedContentIds = (progress ?? []).map((p: any) => p.workout_id);
  }

  // Social proof: real buyer reviews of THIS program (program_reviews), not
  // stream comments. Shown only from 3 reviews up — a lone rating reads as
  // fabricated rather than as proof.
  let social: { average: number; count: number } | null = null;
  const { data: ratings } = await supabase
    .from("program_reviews")
    .select("rating")
    .eq("product_id", product.id);
  if (ratings && ratings.length >= 3) {
    const sum = ratings.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    social = {
      average: Math.round((sum / ratings.length) * 10) / 10,
      count: ratings.length,
    };
  }

  return {
    product: product as Product,
    items,
    isAuthenticated: !!user,
    owned,
    grantedAt,
    expiresAt,
    completedContentIds,
    social,
  };
}
