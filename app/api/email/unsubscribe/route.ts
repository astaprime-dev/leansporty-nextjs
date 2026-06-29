import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { verifyEmailToken } from "@/lib/email-token";

export const runtime = "nodejs";

/**
 * One-click unsubscribe for recovery (and future) emails.
 *
 *  - GET  /api/email/unsubscribe?email=…&token=…  → opt out + friendly HTML page (footer link)
 *  - POST same query                              → RFC 8058 one-click (List-Unsubscribe-Post)
 *
 * The token is HMAC(email) (lib/email-token) so the link can't be used to opt out
 * arbitrary addresses. Opted-out emails are suppressed by the recovery sender.
 */
async function optOut(email: string): Promise<void> {
  const db = getServiceRoleClient();
  await db
    .from("email_opt_outs")
    .upsert(
      { email: email.trim().toLowerCase(), reason: "unsubscribe" },
      { onConflict: "email" }
    );
}

function page(message: string, ok: boolean): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Lean Sporty</title></head>
<body style="margin:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:64px auto;background:#fff;border:1px solid #fbcfe8;border-radius:16px;padding:32px;text-align:center;">
<div style="font-family:Georgia,serif;font-size:22px;color:#111827;margin-bottom:16px;">Lean <span style="color:#ec4899;">Sporty</span></div>
<p style="font-size:16px;line-height:1.6;color:${ok ? "#111827" : "#b91c1c"};margin:0;">${message}</p>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!email || !verifyEmailToken(email, token)) {
    return page("This unsubscribe link is invalid or has expired.", false);
  }
  await optOut(email);
  return page(
    "You're unsubscribed. You won't receive any more checkout reminders from us.",
    true
  );
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  if (!email || !verifyEmailToken(email, token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }
  await optOut(email);
  return NextResponse.json({ unsubscribed: true });
}
