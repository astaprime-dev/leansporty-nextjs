import { siteUrl } from "@/lib/email";
import { signEmailToken } from "@/lib/email-token";

/**
 * Branded HTML for the abandoned-checkout recovery sequence.
 *
 * Email clients don't load web fonts reliably, so the "display" face falls back to
 * Georgia serif (echoes the Playfair editorial direction) and body uses the system
 * sans stack. Everything is table-based + inline-styled for client compatibility.
 * The pink CTA uses a solid pink fallback (gradients are unreliable in email).
 */

const PINK = "#ec4899"; // pink-500 — matches the brand button
const INK = "#111827"; // gray-900
const MUTED = "#6b7280"; // gray-500
const FROM_NAME = "Anna";

// EU imprint — operator is Astaprime Sp. z o.o. (Poland). Required in marketing email.
const IMPRINT = "Astaprime Sp. z o.o. · Poland (EU)";

export type RecoveryStepKey = "reminder" | "value" | "lastcall";

type StepContent = {
  subject: string;
  preheader: string;
  heading: string;
  /** Body paragraphs (HTML-safe plain strings). */
  body: string[];
  cta: string;
};

const STEPS: Record<RecoveryStepKey, StepContent> = {
  reminder: {
    subject: "Your spot in the 21-Day Dance Challenge is still open",
    preheader: "You're one click from Day 1 — no equipment, dance it out at home.",
    heading: "You left mid-way — want to pick it back up?",
    body: [
      `Hi — it's ${FROM_NAME} from Lean Sporty. I noticed you started joining the 21-Day Dance Challenge but didn't quite finish.`,
      "No pressure at all. Your details are saved, so you can pick up right where you left off in one click.",
      "It's a one-time €49 — lifetime access, not a subscription. Fifteen feel-good guided sessions plus rest days, all from home, no equipment.",
    ],
    cta: "Pick up where I left off",
  },
  value: {
    subject: "What 21 days of dancing actually feels like",
    preheader: "Day 1 is free to try — see how it feels before you commit.",
    heading: "Three weeks. Fifteen sessions. Zero equipment.",
    body: [
      `Still thinking it over? Totally fair. Here's what the 21-Day Dance Challenge is, plainly:`,
      "Short, joyful dance workouts you can do in your living room — built for women who'd rather move than grind. Three weeks of guided sessions with built-in rest days, so it's a rhythm you can actually keep.",
      "You don't have to take my word for it: <strong>Day 1 is free</strong>. Try it, see how it feels, then decide. And if you do join, it's yours for life — €49 once, no recurring charge.",
    ],
    cta: "Try Day 1 free",
  },
  lastcall: {
    subject: "Last note from me about the Challenge",
    preheader: "I'll stop here — but your spot's still saved if you want it.",
    heading: "One last nudge, then I'll leave you be",
    body: [
      `This is the last email I'll send about this — promise. If the timing isn't right, that's completely okay.`,
      "But if a bit of daily movement that actually feels good is something you've been meaning to start, your spot is still saved and you're one click from Day 1.",
      "€49 once, lifetime access, dance it out whenever suits you.",
    ],
    cta: "Start the Challenge",
  },
};

function recoveryUrl(productSlug: string, step: RecoveryStepKey): string {
  const u = new URL(`${siteUrl()}/${productSlug === "21-day-dance-challenge" ? "challenge" : productSlug}`);
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "recovery");
  u.searchParams.set("utm_campaign", "abandoned_checkout");
  u.searchParams.set("utm_content", step);
  return u.toString();
}

export function unsubscribeUrl(email: string): string {
  const u = new URL(`${siteUrl()}/api/email/unsubscribe`);
  u.searchParams.set("email", email);
  u.searchParams.set("token", signEmailToken(email));
  return u.toString();
}

function layout(opts: {
  preheader: string;
  heading: string;
  body: string[];
  cta: string;
  ctaUrl: string;
  unsubUrl: string;
}): string {
  const paragraphs = opts.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${p}</p>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <title>Lean Sporty</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf2f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #fbcfe8;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${INK};">Lean <span style="color:${PINK};">Sporty</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 4px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.3;color:${INK};">${opts.heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${paragraphs}
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="${PINK}" style="border-radius:9999px;">
                    <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">${opts.cta} →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:20px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
              <p style="margin:0 0 6px;">You're receiving this because you started a purchase at Lean Sporty.</p>
              <p style="margin:0 0 6px;">${IMPRINT}</p>
              <p style="margin:0;"><a href="${opts.unsubUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from these emails</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderRecoveryEmail(
  step: RecoveryStepKey,
  ctx: { email: string; productSlug: string }
): { subject: string; html: string } {
  const content = STEPS[step];
  const html = layout({
    preheader: content.preheader,
    heading: content.heading,
    body: content.body,
    cta: content.cta,
    ctaUrl: recoveryUrl(ctx.productSlug, step),
    unsubUrl: unsubscribeUrl(ctx.email),
  });
  return { subject: content.subject, html };
}
