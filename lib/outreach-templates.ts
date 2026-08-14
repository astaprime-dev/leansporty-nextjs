/**
 * The 3-touch outreach sequence, transcribed verbatim from
 * docs/INSTRUCTOR_OUTREACH.md. That doc is the operator playbook; this file is
 * the machine-readable copy the /admin/outreach panel renders into the
 * clipboard. Edit BOTH when the copy changes — and check the numbers against
 * INSTRUCTOR_PITCH.md at the workspace root, which is the source of truth.
 *
 * Claims discipline (from the playbook) — allowed in a DM: 80% standard / 85%
 * featured, always "of every sale after VAT" · no monthly fee, no listing fee,
 * no minimum fee · €15 seat → €9.76, €49 program → €33.86 featured · paid
 * monthly via Stripe or bank transfer · automatic recording of live classes ·
 * watermarked, non-downloadable playback · ~10-minute setup.
 *
 * Forbidden (not built — one skeptical prospect checking and the credibility is
 * gone): any other payout timing · notifications to her followers when she goes
 * live · any audience-size or earnings promise · membership revenue · "apps".
 *
 * Send in whatever language you share with the instructor, but keep every
 * number identical.
 */

export type TouchNumber = 1 | 2 | 3;

/** Personalization slots. Unfilled slots are surfaced, never silently blanked. */
export type TouchSlots = {
  /** Her first name. */
  name?: string | null;
  /** What she teaches — "bachata", "pilates". Available to templates. */
  style?: string | null;
  /** One concrete post or detail of hers. The anti-mass-DM line. */
  specific_thing?: string | null;
  /** The /welcome/<code> link. Touch 3 only. */
  invite_link?: string | null;
};

type TouchDef = {
  n: TouchNumber;
  label: string;
  /** Days to wait after the previous touch before this one is due. */
  waitDays: number;
  /** Slots that must be filled before this touch can be sent. */
  requires: (keyof TouchSlots)[];
  body: string;
};

export const TOUCHES: Record<TouchNumber, TouchDef> = {
  1: {
    n: 1,
    label: "Touch 1 — the opener",
    waitDays: 0,
    requires: ["name", "specific_thing"],
    body: `Hi {name} — {specific_thing} is genuinely great. I run Lean Sporty, a small platform where dance & fitness instructors teach paid live classes and sell their own video programs from their own page. You set the prices and keep 80–85% of every sale after VAT — we run the website, payments, streaming, the sales tax, and support.

If you're curious: leansporty.com/teach. Happy to answer anything right here.`,
  },
  2: {
    n: 2,
    label: "Touch 2 — the numbers (+3 days)",
    waitDays: 3,
    requires: [],
    body: `Quick follow-up with real numbers, then I'll stop 🙂 A €49 program pays you €33.86 as a featured instructor (85% after VAT — we handle the VAT for you). A €15 class seat pays €9.76. No monthly fee, no listing fee, no minimum fee — if nothing sells, you've spent time, never money. And every live class is recorded automatically, so one evening of teaching can become a program you sell forever. Would this fit how you teach?`,
  },
  3: {
    n: 3,
    label: "Touch 3 — the personal invite (+4 days)",
    waitDays: 4,
    requires: ["invite_link"],
    body: `Last note from me, promise. I've saved you a featured spot — 85% of every sale after VAT, something we only offer our first instructors. Here's your personal invite: {invite_link} — it opens your Studio and takes about 10 minutes to set up your page. If now isn't the time, no problem at all — the door stays open.`,
  },
};

/** Inbound approval, for applications that arrive through /teach. */
export const APPROVAL_EMAIL = {
  subject: "You're in — your Lean Sporty instructor invite",
  body: `Hi {name} — thanks for applying. I read it personally, and I'd love to have you as a featured instructor: you keep 85% of every sale after VAT. Here's your personal invite: {invite_link}. It signs you in and opens your Studio — about 10 minutes to set up your page and schedule your first class. Any question, just reply — you're talking to the founder.`,
};

/**
 * Fill the slots in a template. Returns the rendered text plus any slot that
 * was left empty, so the UI can refuse to copy a half-personalized DM rather
 * than sending "Hi  — is genuinely great."
 */
export function fillSlots(
  template: string,
  slots: TouchSlots
): { text: string; missing: string[] } {
  const missing: string[] = [];
  const text = template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = slots[key as keyof TouchSlots];
    if (typeof value !== "string" || value.trim() === "") {
      missing.push(key);
      return `{${key}}`;
    }
    return value.trim();
  });
  return { text, missing };
}

/** Render one touch of the sequence for a prospect. */
export function renderTouch(
  n: TouchNumber,
  slots: TouchSlots
): { label: string; text: string; missing: string[] } {
  const touch = TOUCHES[n];
  const { text, missing } = fillSlots(touch.body, slots);
  return { label: touch.label, text, missing };
}
