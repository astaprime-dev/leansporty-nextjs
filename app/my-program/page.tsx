import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getChallengeData } from "@/app/challenge/data";
import { ProgramGrid } from "@/components/challenge/program-grid";
import { FinalizingAccess } from "@/components/challenge/cta";
import { Button } from "@/components/ui/button";
import {
  CHALLENGE_SLUG,
  buildProgramDays,
  completedWorkoutDays,
  formatPrice,
  isDripEnabled,
  programLengthDays,
  totalWorkoutDays,
} from "@/lib/challenge";

export const dynamic = "force-dynamic";

export default async function MyProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { purchased } = await searchParams;

  // Auth required. Anonymous deep-link → the public landing (which carries the
  // sign-in CTAs that resume into My Program). CHALLENGE §9.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/challenge");

  const data = await getChallengeData();

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-pink-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Your program is being prepared
        </h1>
        <p className="mt-2 text-muted-foreground">
          Check back shortly — your sessions will appear here.
        </p>
      </div>
    );
  }

  const { product, owned } = data;
  const totalDays = programLengthDays(product.config);
  const priceLabel = formatPrice(product.price_cents, product.currency);

  const days = buildProgramDays(totalDays, data.items, {
    owned,
    completedContentIds: new Set(data.completedContentIds),
    dripEnabled: isDripEnabled(product.config),
    grantedAt: data.grantedAt,
  });

  const total = totalWorkoutDays(days);
  const done = completedWorkoutDays(days);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Post-checkout: poll for the async webhook grant so no paywall flashes. */}
      {purchased === "1" && !owned && <FinalizingAccess slug={CHALLENGE_SLUG} />}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{product.title}</h1>
        {owned ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {done} of {total} sessions complete
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {done === 0
                ? "Ready when you are — start with Day 1."
                : done >= total
                  ? "You finished the challenge — amazing work! 🎉"
                  : "Keep the momentum going — your next session is ready."}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-pink-200 bg-pink-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
              <p className="text-sm text-pink-800">
                Day 1 is free to try. Unlock all sessions with lifetime access.
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500"
            >
              <Link href="/challenge">Unlock the full challenge — {priceLabel}</Link>
            </Button>
          </div>
        )}
      </header>

      <ProgramGrid days={days} priceLabel={priceLabel} />
    </div>
  );
}
