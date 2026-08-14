import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdminOrSecret } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-5";
const BATCH_SIZE = 20;
/** At or above this, she goes into the outreach queue. */
const QUALIFY_AT = 60;
/**
 * Between this and QUALIFY_AT the answer is "probably, but the evidence is too
 * thin to say" — typically an individual instructor found through a studio
 * website, where we have no bio and no follower count. Rejecting those loses
 * real candidates, so they stay 'new' for a human glance (and for enrichment)
 * with their score and reason attached, rather than disappearing.
 */
const BORDERLINE_AT = 45;

/**
 * The ICP, lifted from docs/INSTRUCTOR_OUTREACH.md. Kept in the prompt rather
 * than the code so the judgement lives next to the reasoning that justifies it.
 */
const SYSTEM = `You screen Instagram accounts for Lean Sporty, a platform where dance and fitness instructors teach paid live classes and sell video programs.

We are looking for:
- Women dance/fitness instructors who actually teach (dance fitness, Zumba-style, Latin, pilates, strength/sculpt hybrids).
- Whose audience skews women 30+.
- Roughly 5k–50k followers WITH real engagement. Engagement beats follower count.
- Already posting teaching clips — she has content, an audience that watches her teach, and probably recordings that could become a program on day one.
- Bonus signals: a link-in-bio booking page, "DM me for classes", complaints about Instagram reach.

We are NOT looking for:
- Mega-influencers (they want guarantees).
- Accounts with no teaching content — nothing to sell.
- Accounts whose audience is mostly other instructors.
- Gyms and gym chains (they sell access to a building, and a chain won't onboard on a new platform), shops, event pages, festivals, aggregators.
- Equipment/venue-format studios whose classes a member CANNOT do at home: reformer-pilates, pole, aerial, aqua.
- NOTE: a dance-fitness / zumba / stretching / movement STUDIO with a real audience is NOT a reject — it's a strong lead (it brings distribution and already wants online revenue). Score it like an instructor. Only the two bullets above are out.
- **Dance as an art form rather than as fitness.** Ballroom and partner-dance academies, children's and youth dance schools, competition and exam-track technique training, ballet, contemporary, street/breaking crews, wedding-first-dance coaching, performance troupes. These are real dance teachers, but their students come to get better at dancing — ours come to move, sweat and feel good in a 45-minute class they can do at home. If her classes need a partner, a studio floor, or a syllabus, she is not a fit.

The test that matters: could a 38-year-old woman with no dance background follow this in her living room and finish it feeling like she worked out? If not, score it low no matter how good the dancing is.

Score 0–100 for fit. Be strict: a wrong yes costs a wasted DM and a bit of credibility, a wrong no costs nothing — there are plenty more accounts. Score below 60 for anything you would not personally message. Give a reason in one short sentence, in English, written for the founder reading a queue.`;

const SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          handle: { type: "string" },
          is_instructor: { type: "boolean" },
          discipline: { type: "string" },
          language: { type: "string" },
          teaches_women_30plus: { type: "boolean" },
          score: { type: "integer" },
          reason: { type: "string" },
        },
        required: [
          "handle",
          "is_instructor",
          "discipline",
          "language",
          "teaches_women_30plus",
          "score",
          "reason",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
} as const;

type ScoreResult = {
  handle: string;
  is_instructor: boolean;
  discipline: string;
  language: string;
  teaches_women_30plus: boolean;
  score: number;
  reason: string;
};

/**
 * POST /api/admin/outreach/score
 *
 * Classifies unscored prospects against the ICP so the queue only ever shows
 * plausible instructors. One request per batch of 20 bios — cheap enough that
 * the whole list costs a couple of euros.
 *
 * Rows below the threshold are stored as 'rejected' rather than deleted: when
 * another lane finds the same account next month, the unique handle index plus
 * that status means it never resurfaces in the queue.
 *
 * A prospect with no bio can't be judged — pasted handles carry nothing but the
 * handle — so those are left as 'new' for a human glance, and reported.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminOrSecret(request);
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const db = getServiceRoleClient();

    const { data: rows, error } = await db
      .from("outreach_prospects")
      .select(
        "id,handle,display_name,bio,followers,external_link,city,country,discipline,metadata"
      )
      .eq("status", "new")
      .is("scored_at", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE * 3);
    if (error) throw error;

    // Her own bio is the best signal, but a swept prospect has none — Instagram
    // login-walls server-side requests — so fall back to what the studio site
    // her handle was found on says about itself.
    const evidence = (r: (typeof rows)[number]) => {
      const bio = typeof r.bio === "string" ? r.bio.trim() : "";
      if (bio) return { text: bio, kind: "her Instagram bio" as const };
      const ctx = (r.metadata as Record<string, unknown> | null)
        ?.source_context;
      if (typeof ctx === "string" && ctx.trim()) {
        return { text: ctx.trim(), kind: "the studio website her handle was listed on" as const };
      }
      return null;
    };

    const judgeable = (rows ?? []).filter((r) => evidence(r) !== null);
    const withoutBio = (rows ?? []).length - judgeable.length;
    const batch = judgeable.slice(0, BATCH_SIZE);

    if (batch.length === 0) {
      return NextResponse.json({
        scored: 0,
        qualified: 0,
        rejected: 0,
        skippedNoBio: withoutBio,
        remaining: 0,
      });
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content:
            "Score each of these accounts. Return one result per account, using the handle exactly as given.\n\n" +
            "Each entry carries `evidence` and `evidence_source`. When the source is the studio website rather than her own bio, it describes the PLACE, not necessarily the person — judge whether the place teaches dance fitness to adult women, and say in your reason if the account looks like the studio itself rather than an individual instructor. A studio is not someone we DM, but it is worth opening to find the instructors who teach there; score those around 40 and say so.\n\n" +
            batch
              .map((r) => {
                const ev = evidence(r)!;
                return JSON.stringify({
                  handle: r.handle,
                  name: r.display_name,
                  followers: r.followers,
                  evidence: ev.text,
                  evidence_source: ev.kind,
                  link: r.external_link,
                  location: [r.city, r.country].filter(Boolean).join(", "),
                });
              })
              .join("\n"),
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "scoring declined for this batch" },
        { status: 502 }
      );
    }

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      throw new Error("no text block in scoring response");
    }
    const parsed = JSON.parse(text.text) as { results: ScoreResult[] };

    const byHandle = new Map(batch.map((r) => [r.handle as string, r]));
    let qualified = 0;
    let rejected = 0;
    let borderlineCount = 0;
    const now = new Date().toISOString();

    for (const result of parsed.results ?? []) {
      const row = byHandle.get(result.handle);
      if (!row) continue; // hallucinated handle — ignore rather than guess
      const score = clamp(result.score);
      const passes = result.is_instructor && score >= QUALIFY_AT;
      const borderline =
        !passes && result.is_instructor && score >= BORDERLINE_AT;
      if (passes) qualified += 1;
      else if (borderline) borderlineCount += 1;
      else rejected += 1;

      await db
        .from("outreach_prospects")
        .update({
          score,
          score_reason: result.reason?.slice(0, 500) ?? null,
          scored_at: now,
          status: passes ? "qualified" : borderline ? "new" : "rejected",
          discipline: row.discipline ?? result.discipline?.slice(0, 60) ?? null,
          language: result.language?.slice(0, 10) ?? null,
          updated_at: now,
        })
        .eq("id", row.id);
    }

    return NextResponse.json({
      scored: qualified + rejected + borderlineCount,
      qualified,
      rejected,
      borderline: borderlineCount,
      skippedNoBio: withoutBio,
      remaining: Math.max(0, judgeable.length - batch.length),
    });
  } catch (e) {
    console.error("Outreach scoring failed:", e);
    return NextResponse.json({ error: "scoring failed" }, { status: 500 });
  }
}

function clamp(n: unknown): number {
  const value = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.min(100, Math.max(0, value));
}
