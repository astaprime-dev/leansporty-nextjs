import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/entitlements/status?slug=<product-slug>
 *
 * Returns { owned } for the current user. Used by the post-checkout
 * "finalizing access" poller (UX-FR-1): the Stripe webhook grants the
 * entitlement asynchronously, so My Program polls this until owned flips true.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ owned: false, authenticated: false }, { status: 401 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ owned: false }, { status: 404 });
  }

  const { data: ent } = await supabase
    .from("entitlements")
    .select("id")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .maybeSingle();

  return NextResponse.json({ owned: !!ent });
}
