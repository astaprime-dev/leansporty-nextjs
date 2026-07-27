import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/instructor/payout-method   Body: { method: 'stripe' | 'manual' }
 *
 * Persists the instructor's payout-method choice (the radio on
 * payout-details — click = switch, no save button). RLS-scoped update of the
 * caller's own instructor_billing row; before that row exists there is
 * nothing to route yet, so the choice is only a view state and 409 is fine to
 * ignore client-side.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const method = body?.method;
  if (method !== "stripe" && method !== "manual") {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!instructor) {
    return NextResponse.json({ error: "not an instructor" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("instructor_billing")
    .update({ payout_method: method, updated_at: new Date().toISOString() })
    .eq("instructor_id", instructor.id)
    .select("instructor_id");
  if (error) {
    console.error("payout_method update failed:", error);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "no details yet" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
