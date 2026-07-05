import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Magic-link landing on OUR domain (trust + deliverability): the email
 * template links to /auth/confirm?token_hash=...&type=email instead of the
 * raw supabase.co verify URL. We exchange the token hash for a session
 * server-side, then resume the user's intent.
 *
 * `redirect_to` comes from the emailRedirectTo we passed at send time, which
 * Supabase validates against its redirect allowlist — but we still only
 * follow same-path redirects (relative) or explicit http(s) URLs whose value
 * came through that allowlist.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const redirectTo = url.searchParams.get("redirect_to");
  const origin = url.origin;

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/sign-in?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    // Expired or already-used link → recovery, not a dead-end.
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(
        "That sign-in link has expired — request a new one."
      )}`
    );
  }

  // Resolve where to land: explicit redirect target, else role default.
  if (redirectTo) {
    try {
      const target = new URL(redirectTo, origin);
      // The value passed through Supabase's redirect allowlist at send time;
      // still restrict to http(s) to rule out javascript: style schemes.
      if (target.protocol === "https:" || target.protocol === "http:") {
        return NextResponse.redirect(target.toString());
      }
    } catch {
      /* fall through to default */
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roles = user?.app_metadata?.roles || [];
  const defaultRedirect = roles.includes("instructor") ? "/instructor" : "/my-program";
  return NextResponse.redirect(`${origin}${defaultRedirect}`);
}
