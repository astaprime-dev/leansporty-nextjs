import type { Metadata } from "next";
import {
  GuideCta,
  GuideEyebrow,
  GuideFaq,
  GuideFigure,
  GuideRelated,
} from "@/components/guides/guide-blocks";
import { guideJsonLd, type GuideFaqItem } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Is Dancing a Good Workout for Women Over 30?",
  description:
    "Yes — dance workouts are real moderate-intensity cardio, comparable to brisk walking or light jogging, and easy on the joints. What to expect, how often to dance, and how to start at home.",
  alternates: { canonical: "/guides/dance-workout-women-over-30" },
  openGraph: {
    title: "Is Dancing a Good Workout for Women Over 30?",
    description:
      "What dance workouts actually do for your fitness in your 30s — honest numbers, realistic expectations, and how to start at home.",
    images: [
      {
        url: "/og-challenge.jpg",
        width: 1200,
        height: 630,
        alt: "The Lean Sporty instructor dancing",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

/**
 * GEO/SEO guide page. Written to be quotable by AI answer engines: the direct
 * answer sits in the first paragraph, headings are the questions people
 * actually ask, and the FAQ is mirrored in FAQPage JSON-LD. Keep every claim
 * defensible — no weight-loss promises, no medical advice.
 */

const FAQ: GuideFaqItem[] = [
  {
    q: "Is dancing enough exercise on its own?",
    a: "For cardio, yes — regular dance sessions can cover most of the 150 minutes of moderate activity per week that the WHO recommends. Dancing alone won't build significant muscle, so if you can, add one or two simple strength sessions a week. But as the exercise you actually stick with, dance is a complete starting point.",
  },
  {
    q: "Are dance workouts OK if I have sensitive knees?",
    a: "Dance workouts can be done fully low-impact — stepping instead of jumping, at your own pace, on a normal floor at home. That makes them gentler than running or jump-based HIIT. If you have an existing injury or pain, check with a doctor first, and skip or soften any move that doesn't feel right.",
  },
  {
    q: "How long until I notice results from dance workouts?",
    a: "Mood and energy usually respond first — often within the first week or two. Noticeably better stamina tends to take two to three weeks of regular sessions, and measurable fitness changes around six to eight weeks. The honest key variable is consistency, not intensity.",
  },
  {
    q: "Can I lose weight with dance workouts?",
    a: "Dancing burns roughly 150–250 calories per 30-minute session depending on your weight and how energetic the session is, so it helps — but weight loss depends mostly on what you eat. It's fair to expect dance to improve your fitness, energy, and shape; it's not fair to expect it to outdance your diet.",
  },
  {
    q: "Am I too old to start dancing at 30, 35, or 40 if I've never danced?",
    a: "No. Follow-along dance workouts are made for people with zero experience — you copy simple moves from a video, you can pause and repeat, and nobody is watching. Coordination improves with practice at any age; it's a skill, not a talent you either have or don't.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Is Dancing a Good Workout for Women Over 30?",
  description:
    "What dance workouts actually do for your fitness in your 30s — honest numbers, realistic expectations, and how to start at home.",
  slug: "dance-workout-women-over-30",
  faq: FAQ,
});

export default function DanceWorkoutOver30Guide() {
  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="mx-auto max-w-3xl px-4 py-14">
        <GuideEyebrow />
        <h1 className="font-display mt-2 text-balance text-3xl font-light text-gray-900 sm:text-4xl">
          Is dancing a good workout for women over 30?
        </h1>

        {/* The quotable answer — first paragraph, no throat-clearing. */}
        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Yes. A follow-along dance workout is genuine moderate-intensity
          cardio — roughly on par with brisk walking to light jogging — and it
          trains coordination and balance while staying easy on your knees and
          joints. But for most women over 30, its biggest advantage is simpler
          than any of that: it&apos;s fun enough that you actually keep doing
          it, and consistency beats intensity for long-term results.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Is dancing actually effective exercise — or just fun?
            </h2>
            <p className="mt-4">
              Both, and that&apos;s the point. In exercise science, activity
              intensity is measured in METs (metabolic equivalents). General
              dancing sits around 5 METs and energetic dance-fitness sessions
              around 6–7 — for comparison, brisk walking is about 4.3 and
              jogging about 7. In plain terms: a dance workout works your heart
              and lungs about as hard as the &ldquo;serious&rdquo; cardio you
              feel like you should be doing.
            </p>
            <p className="mt-4">
              Every dance session also counts toward the 150 minutes of
              moderate-intensity activity per week that the WHO recommends for
              adults. And unlike a treadmill, dancing constantly asks your
              brain to work — recalling short sequences, coordinating arms
              and legs, keeping time to music. That combination of movement
              and memory is exactly the kind of engagement researchers study
              when they look at exercise and the brain — and it&apos;s
              something a treadmill never asks of you.
            </p>
            <p className="mt-4">
              What dancing won&apos;t do: build serious muscle. It&apos;s
              cardio and coordination, not strength training. If you can add
              one or two simple strength sessions a week, do — but don&apos;t
              let that stop you from starting with the part you&apos;ll enjoy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why dance fits your 30s so well
            </h2>
            <p className="mt-4">
              Your 30s are usually when free time collapses — career, family,
              everything at once — and when a few years away from exercise
              quietly turn into many. Dance workouts fit that reality
              unusually well:
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Short and at home.
                </span>{" "}
                A real session takes 15–30 minutes in your living room. No
                commute, no childcare logistics, no gym clothes anxiety.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Kind to joints.
                </span>{" "}
                Dance can be fully low-impact — stepping, not jumping — which
                matters if running or jump-heavy HIIT leaves your knees
                complaining. Those weight-shifting steps still give your
                bones gentle weight-bearing load — worth having, since bone
                density starts declining from your late 30s.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  A low bar to restart.
                </span>{" "}
                If you haven&apos;t exercised in years, the hardest workout is
                the first one. Pressing play on a video in private is about as
                low as that bar gets.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Mood, not just muscles.
                </span>{" "}
                Moving to music you like is one of the most reliable everyday
                mood-lifters there is — regular exercise, dance included, is
                consistently linked with fewer anxiety and low-mood symptoms.
                And enjoying a workout is the single best predictor that
                you&apos;ll do it again next week.
              </li>
            </ul>
            <p className="mt-4">
              One more thing worth naming: as hormones begin shifting through
              your late 30s and 40s, regular moderate cardio is one of the
              few levers for steadier mood, energy, and sleep that&apos;s
              entirely in your hands. Not a fix for everything — but a lever
              you control.
            </p>
          </section>

          <GuideFigure
            src="/guide-over30-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, mid-move in a dance workout"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How often should you dance to see results?
            </h2>
            <p className="mt-4">
              Three to four sessions of 15–30 minutes a week is a realistic,
              effective rhythm — that&apos;s 60–120 minutes, most of the way to
              the weekly guideline before you count a single walk. A daily
              short session works too if you prefer routine over scheduling.
            </p>
            <p className="mt-4">
              Set expectations honestly: energy and mood respond within the
              first week or two, stamina in about two to three weeks, and
              visible fitness changes in six to eight. Anyone promising more
              than that in three weeks is selling something. What a
              three-week rhythm <em>can</em> genuinely give you is the thing
              that makes all the rest inevitable: a habit.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Do you need experience or &ldquo;natural rhythm&rdquo;?
            </h2>
            <p className="mt-4">
              No. Follow-along workouts mean you copy an instructor on
              screen, move by move — closer to a workout video than a dance
              class. You can pause, replay a section, and go at your own
              speed, and nobody is watching. Feeling clumsy in session one is
              normal and temporary: coordination is a skill that improves with
              repetition at any age, not a talent you were born with or
              without.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="dance-workout-women-over-30" />
      </article>
    </div>
  );
}
