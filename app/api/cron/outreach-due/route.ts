import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { renderOutreachDigestEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

/**
 * Daily outreach digest.
 *
 * The prospect list only pays off if it gets opened, and a 3-touch sequence
 * silently rots if nobody looks at what's due. This mails the founder when —
 * and only when — there is something to act on.
 *
 * Nothing here messages a prospect: Meta prohibits cold DM automation, so the
 * only thing automated is the reminder to go and do it by hand.
 *
 * Schedule: daily (Vercel Hobby allows only daily crons).
 * Auth: Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getServiceRoleClient();
    const now = new Date().toISOString();

    const { data: dueRows, error } = await db
      .from("outreach_prospects")
      .select("handle,t1_at,t2_at,status")
      .in("status", ["qualified", "contacted"])
      .or(`next_touch_at.is.null,next_touch_at.lte.${now}`)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw error;

    const { count: unscored } = await db
      .from("outreach_prospects")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    const due = dueRows ?? [];
    if (due.length === 0 && (unscored ?? 0) === 0) {
      // Say nothing rather than train the founder to ignore this email.
      return NextResponse.json({ success: true, due: 0, emailed: false });
    }

    const to = process.env.FOUNDER_NOTIFY_EMAIL ?? process.env.EMAIL_REPLY_TO;
    if (!to) {
      return NextResponse.json(
        { success: false, error: "no founder notify address configured" },
        { status: 500 }
      );
    }

    const { subject, html } = renderOutreachDigestEmail({
      due: due.length,
      unscored: unscored ?? 0,
      samples: due.slice(0, 10).map((r) => ({
        handle: r.handle as string,
        // Which touch is next: the first one not yet stamped.
        touch: !r.t1_at ? 1 : !r.t2_at ? 2 : 3,
      })),
    });

    try {
      await sendEmail({ to, subject, html });
    } catch (e) {
      // sendEmail throws; a failed digest must not fail the cron run.
      console.error("[outreach-due] send failed:", e);
      return NextResponse.json({ success: false, due: due.length, emailed: false });
    }

    return NextResponse.json({
      success: true,
      due: due.length,
      unscored: unscored ?? 0,
      emailed: true,
      timestamp: now,
    });
  } catch (e) {
    console.error("[outreach-due] failed:", e);
    return NextResponse.json({ error: "digest failed" }, { status: 500 });
  }
}
