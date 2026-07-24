import Link from "next/link";
import Image from "next/image";
import { Play, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getChallengeData } from "@/app/challenge/data";
import { ProgramGrid } from "@/components/challenge/program-grid";
import { FinalizingAccess } from "@/components/challenge/cta";
import { PurchaseCelebration } from "@/components/purchase-celebration";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/empty-state";
import {
  CHALLENGE_SLUG,
  buildProgramDays,
  completedWorkoutDays,
  formatDuration,
  formatPrice,
  isDripEnabled,
  mergeCanonicalItems,
  nextActionableDay,
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

  // Instructor programs the user owns (kind='course') — linked below so this
  // page stays the single "my training" entry point.
  const { data: ownedProgramEnts } = await supabase
    .from("entitlements")
    .select("product_id")
    .eq("user_id", user.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  const ownedProductIds = (ownedProgramEnts ?? []).map((e) => e.product_id);
  // The challenge itself is a kind='course' product too (house instructor) —
  // exclude it here since this whole page IS the challenge view.
  const { data: ownedPrograms } = ownedProductIds.length
    ? await supabase
        .from("products")
        .select("id, slug, title, subtitle, cover_image_url")
        .eq("kind", "course")
        .neq("slug", CHALLENGE_SLUG)
        .in("id", ownedProductIds)
    : { data: null };

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Your program is being prepared"
          description="Check back shortly — your sessions will appear here."
        />
      </div>
    );
  }

  const { product, owned, expiresAt } = data;
  const accessUntil = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const totalDays = programLengthDays(product.config);
  const priceLabel = formatPrice(product.price_cents, product.currency);

  const days = buildProgramDays(
    totalDays,
    mergeCanonicalItems(data.items, product.id),
    {
      owned,
      completedContentIds: new Set(data.completedContentIds),
      dripEnabled: isDripEnabled(product.config),
      grantedAt: data.grantedAt,
    }
  );

  const total = totalWorkoutDays(days);
  const done = completedWorkoutDays(days);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Today's session: the first not-yet-completed playable day.
  const nextDay = owned ? nextActionableDay(days) : null;
  const nextWorkout = nextDay?.item?.workout ?? null;

  // Review prompt: after Week 1 (5 sessions), if she hasn't reviewed yet.
  // Reviews feed the /challenge social-proof section (visible from 3 reviews).
  let showReviewPrompt = false;
  let reviewHref = "";
  if (owned && done >= 5) {
    const { data: myReview } = await supabase
      .from("program_reviews")
      .select("rating")
      .eq("product_id", data.product.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const anyLesson = days.find((d) => d.item?.workout)?.item;
    if (!myReview && anyLesson) {
      showReviewPrompt = true;
      reviewHref = `/programs/${CHALLENGE_SLUG}/watch/${anyLesson.content_id}#review`;
    }
  }

  // Anastasiia's nudge + the milestone line, keyed to progress (5-session weeks).
  const nudge =
    done === 0
      ? "We start easy — see you at Day 1."
      : done >= total
        ? "You did the whole thing. I'm so proud of you."
        : done < 5
          ? "The first week builds the habit. Keep going."
          : done < 10
            ? "Week two — this is where it starts to feel natural."
            : "Final week. Finish strong — I'm with you.";
  const toWeek = 5 - (done % 5);
  const weekNo = Math.floor(done / 5) + 1;
  const milestone =
    done >= total
      ? "You finished the challenge — amazing work!"
      : !nextWorkout && done > 0
        ? "Every available session is done — the final sessions land soon."
        : `${toWeek} session${toWeek === 1 ? "" : "s"} to finish Week ${weekNo}.`;

  return (
    <div className="w-full">
      {/* Warm hero band — same brand world as the sales pages. */}
      <section className="bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-10">
          {/* Post-checkout: poll for the async webhook grant so no paywall flashes. */}
          {purchased === "1" && !owned && <FinalizingAccess slug={CHALLENGE_SLUG} />}

          {/* ...and once it lands, celebrate — she just bought, greet the moment. */}
          {purchased === "1" && owned && (
            <PurchaseCelebration
              heading="You're in — welcome to the challenge"
              message="Payment confirmed. Every session is yours for a full year — no rush, no pressure. Day 1 is right below whenever you're ready."
              clearPath="/my-program"
            />
          )}

          <header>
            <h1 className="font-display text-3xl sm:text-4xl font-light text-gray-900">{product.title}</h1>
            {owned ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {done} of {total} sessions complete
                  </span>
                  <span>{pct}%</span>
                </div>
                {/* Week markers at 5 and 10 sessions — progress with milestones. */}
                <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/80" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/80" />
                </div>
                <p className="mt-3 text-sm text-gray-600">{milestone}</p>
                {accessUntil && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Access until {accessUntil}
                  </p>
                )}

                {/* Anastasiia's nudge — a trainer who noticed, not a dashboard. */}
                <div className="mt-5 flex items-center gap-3">
                  <Image
                    src="/instructor-pink.jpg"
                    alt="Anastasiia"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover object-[50%_20%]"
                  />
                  <p className="text-sm text-gray-600">
                    {nudge} <span className="text-gray-400">— Anastasiia</span>
                  </p>
                </div>

                {done >= total && total > 0 && (
                  <Button asChild variant="brandOutline" className="mt-4">
                    <Link href="/streams">
                      What&apos;s next? Join a live class →
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Alert variant="info" className="mt-4">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Day 1 is free to try. Unlock all sessions with a full year of access.
                  </p>
                  <Button asChild variant="brand">
                    <Link href="/challenge">Unlock the full challenge — {priceLabel}</Link>
                  </Button>
                </div>
              </Alert>
            )}
          </header>

          {/* Today's session — the one unmistakable action. */}
          {owned && nextDay && nextWorkout && (
            <Link
              href={`/programs/${CHALLENGE_SLUG}/watch/${nextDay.item!.content_id}`}
              className="group mt-6 block overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all hover:border-pink-300 hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-video shrink-0 sm:w-80">
                  {nextWorkout.thumbnailUrl ? (
                    <Image
                      src={nextWorkout.thumbnailUrl}
                      alt={nextWorkout.title ?? `Day ${nextDay.dayNumber}`}
                      fill
                      sizes="(min-width: 640px) 20rem, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-pink-50 to-rose-50" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform group-hover:scale-110">
                      <Play className="ml-0.5 h-6 w-6 text-pink-500" />
                    </span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1.5 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-pink-500">
                    {done === 0 ? "Start here" : "Up next"} · Day {nextDay.dayNumber}
                  </p>
                  <h2 className="font-display text-2xl font-light text-gray-900 sm:text-3xl">
                    {nextWorkout.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {formatDuration(nextWorkout.durationInSeconds)} min
                    {nextWorkout.calories ? ` · ~${nextWorkout.calories} kcal` : ""}
                  </p>
                  <span className="mt-3 inline-flex h-11 w-fit items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 font-semibold text-white transition-colors group-hover:from-pink-600 group-hover:to-rose-500">
                    <Play className="mr-2 h-4 w-4" />
                    {done === 0
                      ? `Start Day ${nextDay.dayNumber}`
                      : `Continue — Day ${nextDay.dayNumber}`}
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Week-1 done + no review yet → the goodwill moment for social proof. */}
          {showReviewPrompt && (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-pink-100 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-5 w-5 shrink-0 fill-pink-400 text-pink-400" />
                <p className="text-sm text-gray-600">
                  A week of dancing done — enjoying it? A short review helps
                  other women find the challenge.
                </p>
              </div>
              <Button asChild variant="brandOutline" className="shrink-0">
                <Link href={reviewHref}>Leave a review</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
      {/* The challenge is a program owned by the house instructor; owned users
          watch lessons on the shared watch page (playlist, feedback, reviews). */}
      <ProgramGrid
        days={days}
        priceLabel={priceLabel}
        {...(owned ? { watchBasePath: `/programs/${CHALLENGE_SLUG}/watch`, hideStartCta: true } : {})}
      />

      {ownedPrograms && ownedPrograms.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-light text-gray-900">
            Your programs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownedPrograms.map((p) => (
              <Link
                key={p.id}
                href={`/programs/${p.slug}`}
                className="group overflow-hidden rounded-2xl border border-pink-100 bg-white transition-all hover:border-pink-300 hover:shadow-md"
              >
                <div className="relative aspect-video bg-gradient-to-br from-pink-50 to-rose-50">
                  {p.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-pink-500">
                    {p.title}
                  </h3>
                  {p.subtitle && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {p.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
