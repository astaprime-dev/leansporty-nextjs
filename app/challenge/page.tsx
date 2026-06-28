import Image from "next/image";
import {
  Check,
  Lock,
  Sparkles,
  Star,
  Heart,
  Home,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import { getChallengeData } from "@/app/challenge/data";
import {
  CheckoutButton,
  PreviewButton,
  ChallengeAutoCheckout,
} from "@/components/challenge/cta";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CHALLENGE_SLUG,
  DEFAULT_PRICE_CENTS,
  DEFAULT_PROGRAM_LENGTH_DAYS,
  DEFAULT_WORKOUT_COUNT,
  buildProgramDays,
  formatDuration,
  formatPrice,
  mergeCanonicalItems,
  programLengthDays,
} from "@/lib/challenge";

export const dynamic = "force-dynamic";

const BENEFITS = [
  {
    icon: Heart,
    title: "Fun, not punishing",
    body: "Feel-good dance routines designed to be enjoyable — movement you'll actually look forward to.",
  },
  {
    icon: Home,
    title: "At home, no equipment",
    body: "Just press play in your living room. No gym, no gear, no choreography experience needed.",
  },
  {
    icon: Clock,
    title: "Short sessions",
    body: "Bite-sized follow-along workouts that fit around a busy life — with rest days built in.",
  },
  {
    icon: InfinityIcon,
    title: "A full year of access",
    body: "Buy once and get a full year — revisit any session whenever you like, on web and iOS.",
  },
];

const FAQ = [
  {
    q: "Do I need any dance experience?",
    a: "None at all. Every session is a beginner-friendly follow-along — you can pause, repeat, and go at your own pace.",
  },
  {
    q: "Is this a subscription?",
    a: "No — it's a one-time payment with no recurring charge. Your access runs for a full year.",
  },
  {
    q: "What if I miss a day?",
    a: "There's no pressure and no deadline. Everything unlocks at once, so you can follow the 21-day rhythm or do it on your own schedule.",
  },
  {
    q: "Can I watch on my phone?",
    a: "Yes — watch on the web today, and on our iOS app once you're signed in with the same account.",
  },
];

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; canceled?: string }>;
}) {
  const { intent, canceled } = await searchParams;
  const data = await getChallengeData();

  const product = data?.product ?? null;
  const isAuthenticated = data?.isAuthenticated ?? false;
  const owned = data?.owned ?? false;

  const title = product?.title ?? "21-Day Dance Challenge";
  const subtitle =
    product?.subtitle ??
    "Three weeks. Fifteen feel-good sessions. Zero equipment.";
  const priceCents = product?.price_cents ?? DEFAULT_PRICE_CENTS;
  const priceLabel = formatPrice(priceCents, product?.currency ?? "eur");
  const workoutCount =
    product?.config?.workout_count ?? DEFAULT_WORKOUT_COUNT;
  const totalDays = product
    ? programLengthDays(product.config)
    : DEFAULT_PROGRAM_LENGTH_DAYS;

  // Always present the full 15-session structure (marketing view = not owned):
  // real items where uploaded, "coming soon" placeholders for the rest.
  const items = mergeCanonicalItems(data?.items ?? [], product?.id);
  const days = buildProgramDays(totalDays, items, {
    owned: false,
    completedContentIds: new Set(),
  });

  return (
    <div className="w-full">
      <ChallengeAutoCheckout
        active={intent === "checkout"}
        productSlug={CHALLENGE_SLUG}
        isAuthenticated={isAuthenticated}
        owned={owned}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          {canceled && (
            <Alert variant="info" className="mx-auto mb-6 max-w-md text-left">
              No worries — your spot is still here whenever you're ready.
            </Alert>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
            <Sparkles className="h-3.5 w-3.5" /> For women who want to enjoy
            moving again
          </span>
          <h1 className="font-display animate-fade-up mt-5 text-4xl font-light tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {subtitle}
          </p>

          {/* Trailer — public marketing video (not one of the signed sessions) */}
          <div className="relative mx-auto mt-8 aspect-video max-w-2xl overflow-hidden rounded-2xl border border-pink-100 shadow-sm">
            <iframe
              src="https://www.youtube.com/embed/PWauX9QceBY?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=PWauX9QceBY&controls=1"
              title="21-Day Dance Challenge preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CheckoutButton
              productSlug={CHALLENGE_SLUG}
              isAuthenticated={isAuthenticated}
              owned={owned}
              next={`/challenge?intent=checkout`}
              label={`Start the Challenge — ${priceLabel}`}
              className="h-12 bg-gradient-to-r from-pink-500 to-rose-400 px-8 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
            />
            {!owned && (
              <PreviewButton
                isAuthenticated={isAuthenticated}
                label="Try Day 1 free"
                className="h-12 px-8 text-base"
              />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {priceLabel} once · 1 year of access · not a subscription
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-pink-100 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-pink-50/50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="font-display text-center text-4xl font-light text-gray-900">
            Your {totalDays} days, mapped out
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            {workoutCount} guided sessions + rest days — Day 1 is free to try.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {days.map((day) => {
              if (day.isRest) {
                return (
                  <div
                    key={day.dayNumber}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/60 text-center"
                  >
                    <span className="text-[10px] font-medium text-gray-400">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-xs text-gray-400">Rest</span>
                  </div>
                );
              }
              if (day.state === "coming-soon") {
                return (
                  <div
                    key={day.dayNumber}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border border-pink-100 bg-white text-center"
                  >
                    <Sparkles className="mb-1 h-5 w-5 text-pink-300" />
                    <span className="text-[10px] font-medium uppercase text-gray-400">
                      Day {day.dayNumber}
                    </span>
                    <span className="text-[10px] text-pink-400">Coming soon</span>
                  </div>
                );
              }
              const isFree = day.state === "preview-free";
              const duration = formatDuration(day.item?.workout?.durationInSeconds);
              return (
                <div
                  key={day.dayNumber}
                  className="relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl border border-pink-100 bg-white"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50">
                    {day.item?.workout?.thumbnailUrl ? (
                      <Image
                        src={day.item.workout.thumbnailUrl}
                        alt={`Day ${day.dayNumber}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Sparkles className="h-6 w-6 text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="absolute right-1.5 top-1.5">
                    {isFree ? (
                      <Badge variant="free" className="px-1.5 py-0.5 text-[9px]">
                        Free
                      </Badge>
                    ) : (
                      <Badge variant="lock" className="h-5 w-5 justify-center p-0">
                        <Lock className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="relative z-10 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
                    <p className="text-[9px] font-medium uppercase text-white/80">
                      Day {day.dayNumber}
                    </p>
                    <p className="text-[10px] font-semibold text-white">
                      {duration ? `${duration} min` : "Session"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof */}
      {data?.social && (
        <section className="mx-auto max-w-5xl px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < Math.round(data.social!.average)
                    ? "h-5 w-5 fill-pink-400 text-pink-400"
                    : "h-5 w-5 text-pink-200"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {data.social.average.toFixed(1)} from {data.social.count} reviews
          </p>
          <p className="text-sm text-muted-foreground">
            Loved by members across our live classes.
          </p>
        </section>
      )}

      {/* Pricing card */}
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border-2 border-pink-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-display text-3xl font-light text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time purchase · 1 year of access
          </p>
          <p className="mt-4 text-5xl font-bold text-gray-900">{priceLabel}</p>
          <p className="text-sm text-muted-foreground">not a subscription</p>
          <ul className="mt-6 space-y-2 text-left text-sm">
            {[
              `${workoutCount} guided sessions + rest days`,
              "A full year of access",
              "Watch on web & iOS",
              "Beginner-friendly, no equipment",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span className="text-gray-700">{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex justify-center">
            <CheckoutButton
              productSlug={CHALLENGE_SLUG}
              isAuthenticated={isAuthenticated}
              owned={owned}
              next={`/challenge?intent=checkout`}
              label={`Start the Challenge — ${priceLabel}`}
              className="h-12 w-full bg-gradient-to-r from-pink-500 to-rose-400 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="font-display text-center text-3xl font-light text-gray-900">
          Questions, answered
        </h2>
        <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <h3 className="font-semibold text-gray-900">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer / waiver */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Lean Sporty is a fitness and wellbeing program, not medical advice.
          Results vary from person to person, and nothing here is a guarantee of
          any specific outcome. Please consult your physician before starting
          this or any exercise program, exercise within your own limits, and
          stop if you feel unwell.
        </p>
      </section>
    </div>
  );
}
