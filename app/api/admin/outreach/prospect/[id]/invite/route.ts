import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { siteUrl } from "@/lib/email";
import { buildInviteCode } from "@/lib/outreach";

export const runtime = "nodejs";

const EXPIRY_DAYS = 30;

/**
 * POST /api/admin/outreach/prospect/[id]/invite
 *
 * Mints a personal invite for a prospect and links it back to her row — this
 * replaces the hand-written SQL in docs/INSTRUCTOR_INVITES.md. Code convention
 * is unchanged (`ls-<name>-<hex>`, ~30-day expiry) so both paths produce the
 * same kind of invite.
 *
 * Minting is deliberately NOT the same event as sending: this sets the invite
 * link and moves her to 'invited', and the founder then copies Touch 3 and
 * marks it sent. The link is what closes the loop — when the code is redeemed,
 * consumeInstructorInvite() flips this prospect to 'activated'.
 *
 * Idempotent: a prospect who already has a live invite gets the same link back
 * rather than a second code.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const db = getServiceRoleClient();

    const { data: prospect, error: readError } = await db
      .from("outreach_prospects")
      .select("id,handle,display_name,discipline,city,invite_code")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!prospect) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (prospect.invite_code) {
      const { data: existing } = await db
        .from("instructor_invites")
        .select("code,used_at,expires_at")
        .eq("code", prospect.invite_code)
        .maybeSingle();
      // Reuse only if it's still redeemable; a burnt or expired code should be
      // replaced rather than re-sent.
      const stillGood =
        existing &&
        !existing.used_at &&
        (!existing.expires_at || new Date(existing.expires_at) > new Date());
      if (stillGood) {
        return NextResponse.json({
          code: existing.code,
          inviteLink: `${siteUrl()}/welcome/${existing.code}`,
          reused: true,
        });
      }
    }

    const invitedName =
      (prospect.display_name as string | null)?.trim() ||
      (prospect.handle as string);
    const code = buildInviteCode(invitedName);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    const noteParts = [
      `IG @${prospect.handle}`,
      prospect.discipline as string | null,
      prospect.city as string | null,
      `outreach ${new Date().toISOString().slice(0, 10)}`,
    ].filter(Boolean);

    const { error: inviteError } = await db.from("instructor_invites").insert({
      code,
      invited_name: invitedName,
      note: noteParts.join(" — "),
      expires_at: expiresAt.toISOString(),
    });
    if (inviteError) throw inviteError;

    const { error: linkError } = await db
      .from("outreach_prospects")
      .update({
        invite_code: code,
        status: "invited",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (linkError) throw linkError;

    return NextResponse.json({
      code,
      inviteLink: `${siteUrl()}/welcome/${code}`,
      expiresAt: expiresAt.toISOString(),
      reused: false,
    });
  } catch (e) {
    console.error("Outreach invite mint failed:", e);
    return NextResponse.json({ error: "mint failed" }, { status: 500 });
  }
}
