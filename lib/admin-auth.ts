import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Founder-only route guard.
 *
 * The 'admin' role lives in auth.users.app_metadata.roles — a JWT claim, so the
 * check costs no query. It is granted once by hand in the Supabase dashboard;
 * no code path grants it (see docs/INSTRUCTOR_PAYOUTS.md). Note middleware.ts
 * only refreshes the session — it does NOT gate /admin, so every admin page and
 * route guards itself.
 *
 * Some machine lanes (the outreach sweeps, which post collected handles from a
 * script) can't carry a session cookie. Those pass the shared CRON_SECRET as a
 * bearer token instead — the same one-liner the four cron routes already use.
 */

export type AdminAuthResult =
  | { ok: true; userId: string | null }
  | { ok: false; response: NextResponse };

/**
 * Guard an admin API route. Returns either { ok: true } or a ready-to-return
 * 401/403 response:
 *
 *   const auth = await requireAdmin();
 *   if (!auth.ok) return auth.response;
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  if (!user.app_metadata?.roles?.includes("admin")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: user.id };
}

/**
 * As requireAdmin(), but also accepts `Authorization: Bearer ${CRON_SECRET}`
 * for scripted callers. Session auth is tried first so a signed-in founder
 * never needs the secret.
 */
export async function requireAdminOrSecret(
  request: Request
): Promise<AdminAuthResult> {
  const secret = process.env.CRON_SECRET;
  if (
    secret &&
    request.headers.get("authorization") === `Bearer ${secret}`
  ) {
    return { ok: true, userId: null };
  }
  return requireAdmin();
}
