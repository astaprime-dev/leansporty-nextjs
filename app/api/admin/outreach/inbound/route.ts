import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";
import { normalizeHandle } from "@/lib/outreach";

export const runtime = "nodejs";

export type InboundApplication = {
  id: string;
  email: string;
  name: string | null;
  social: string | null;
  /** Normalized handle, when the social field parses to one. */
  handle: string | null;
  about: string | null;
  status: string;
  created_at: string;
  /** True when she's already in the prospect list. */
  inList: boolean;
};

/**
 * GET /api/admin/outreach/inbound
 *
 * Instructor applications from /teach. They ride the `leads` table
 * (source='teach-apply', with {name, social, about} in metadata) and until now
 * had no UI at all — the founder read them out of the alert email. Surfacing
 * them here puts inbound and outbound in one pipeline, which matters because an
 * applicant who also turns up in a hashtag sweep must never get a cold DM.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const db = getServiceRoleClient();

    const { data: leads, error } = await db
      .from("leads")
      .select("id,email,status,metadata,created_at")
      .eq("source", "teach-apply")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const applications: InboundApplication[] = (leads ?? []).map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const social = typeof meta.social === "string" ? meta.social : null;
      return {
        id: row.id as string,
        email: row.email as string,
        name: typeof meta.name === "string" ? meta.name : null,
        social,
        handle: social ? normalizeHandle(social) : null,
        about: typeof meta.about === "string" ? meta.about : null,
        status: row.status as string,
        created_at: row.created_at as string,
        inList: false,
      };
    });

    const handles = applications
      .map((a) => a.handle)
      .filter((h): h is string => !!h);
    if (handles.length > 0) {
      const { data: existing } = await db
        .from("outreach_prospects")
        .select("handle")
        .in("handle", handles);
      const inList = new Set((existing ?? []).map((r) => r.handle as string));
      for (const a of applications) {
        if (a.handle && inList.has(a.handle)) a.inList = true;
      }
    }

    return NextResponse.json({ applications });
  } catch (e) {
    console.error("Inbound applications failed:", e);
    return NextResponse.json({ error: "list failed" }, { status: 500 });
  }
}
