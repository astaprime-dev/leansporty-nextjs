import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/stripe";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { AcceptInviteButton } from "@/components/welcome/accept-invite-button";

/**
 * Personal instructor invite (/welcome/<code>) — the link the founder sends after
 * approving an application. Greets the invitee by name, restates the featured
 * deal, and redeems the same single-use code as /instructor/activate — without
 * asking anyone to copy/paste a code.
 *
 * The invites table is deny-all RLS (service-role only). This page does ONE
 * primary-key lookup and renders only that row's name, for the exact code being
 * visited — nothing enumerable leaves the server. Redemption itself still goes
 * through POST /api/instructor/activate (authenticated + rate-limited).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're invited to teach on Lean Sporty",
  robots: { index: false, follow: false, nocache: true },
};

const DEAL_POINTS = [
  "Featured instructors keep 85% of every sale after VAT — live class seats and on-demand programs",
  "Your own page at leansporty.com/@your-name — sales pages, checkout, receipts, and reviews all run for you",
  "Go live from your browser, no software to learn — every class is recorded automatically",
  "Turn recordings and uploads into paid programs that sell while you sleep",
  "Paid monthly by bank transfer — no monthly fee, no listing fee, no risk",
];

export default async function WelcomeInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  const db = getServiceRoleClient();
  const { data: invite } = await db
    .from("instructor_invites")
    .select("code, invited_name, used_by, expires_at")
    .eq("code", code)
    .maybeSingle();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Their own already-redeemed invite (e.g. a refresh right after accepting) →
  // straight to the Studio.
  if (invite?.used_by && user && invite.used_by === user.id) {
    redirect("/instructor");
  }

  const expired =
    !!invite?.expires_at && new Date(invite.expires_at).getTime() < Date.now();

  if (!invite || invite.used_by || expired) {
    return <InviteInactive />;
  }

  // Already an instructor through another path — don't burn the code.
  if (user) {
    const { data: instructorRow } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (instructorRow) redirect("/instructor");
  }

  const name = invite.invited_name?.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-lg sm:p-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
              <Sparkles className="h-3.5 w-3.5" /> Featured instructor invite
            </span>
            <h1 className="font-display mt-4 text-3xl font-light text-gray-900 sm:text-4xl">
              {name
                ? `${name}, you're invited to teach on Lean Sporty`
                : "You're invited to teach on Lean Sporty"}
            </h1>
            <p className="mt-3 text-gray-600">
              We&apos;d love to have you as one of our first featured
              instructors. You teach — we run the website, the streaming, the
              payments, and the support.
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {DEAL_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-gray-700"
              >
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-pink-500" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-pink-100 pt-8">
            {user ? (
              <div className="space-y-3">
                <AcceptInviteButton code={code} />
                <p className="text-center text-xs text-gray-500">
                  Signed in as {user.email}
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-center text-sm font-semibold text-gray-900">
                  Sign in to accept your invite — takes a minute, no password
                  needed.
                </p>
                <AuthForm next={`/welcome/${encodeURIComponent(code)}`} />
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Want the full picture first?{" "}
          <Link
            href="/teach"
            className="font-semibold text-pink-600 hover:text-pink-500"
          >
            Read how teaching works
          </Link>{" "}
          · Questions?{" "}
          <a
            href="mailto:instructors@leansporty.com"
            className="font-semibold text-pink-600 hover:text-pink-500"
          >
            instructors@leansporty.com
          </a>
        </p>
      </div>
    </div>
  );
}

function InviteInactive() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-pink-100 bg-white p-8 text-center shadow-lg">
        <h1 className="font-display text-3xl font-light text-gray-900">
          This invite link isn&apos;t active anymore
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          It may have been used already or expired. If it was meant for you,
          email us and we&apos;ll send you a fresh one.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button asChild variant="brand" className="w-full">
            <a href="mailto:instructors@leansporty.com">
              Email instructors@leansporty.com
            </a>
          </Button>
          <Button asChild variant="brandOutline" className="w-full">
            <Link href="/teach">See how teaching works</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
