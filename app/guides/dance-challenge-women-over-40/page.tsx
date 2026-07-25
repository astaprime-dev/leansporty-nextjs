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
  title: "A Dance Challenge for Women Over 40 (and 50)",
  description:
    "What changes about training in your 40s and 50s, why a structured challenge beats 'just exercise more' for returners, what dance covers well at this age — and what it honestly doesn't replace.",
  alternates: { canonical: "/guides/dance-challenge-women-over-40" },
  openGraph: {
    title: "A Dance Challenge for Women Over 40 (and 50)",
    description:
      "Honest guidance for getting back in shape at 40+: recovery realities, why structure wins, and what dance does and doesn't cover.",
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

const FAQ: GuideFaqItem[] = [
  {
    q: "Is dancing enough exercise after 40 or 50?",
    a: "For cardio, coordination, balance, and mood — yes, genuinely. For muscle and bone strength — not on its own: research consistently shows resistance work matters more with each decade. The honest combination is dance as the cardio you enjoy and stick with, plus one or two simple strength sessions a week. Dance is the part most plans get wrong, because it's the part people quit; fix that first.",
  },
  {
    q: "Can I get in shape at 45 or 50 starting from nothing?",
    a: "Yes — bodies adapt to training at every age; it just happens a bit more gradually and rewards consistency over heroics. Expect the same milestones as any returner (mood first, stamina in weeks, visible fitness in a couple of months) on a slightly more patient clock, and expect them to actually arrive if you keep showing up three or four times a week.",
  },
  {
    q: "Do I need to add weights alongside a dance challenge?",
    a: "Eventually, ideally — muscle and bone respond to load, and dance provides only light loading. But you don't need to solve everything in week one: start with the dance habit, and once it's established, add two short bodyweight or dumbbell sessions a week. A habit you build on beats a perfect plan you abandon.",
  },
  {
    q: "What if I have joint pain or haven't exercised in years?",
    a: "Choose the low-impact route — stepping patterns, no jumping — and shrink any move that complains. Follow-along videos make that easy because you set the size and pace of every movement. If you have an existing injury, joint disease, or pain that appears with exercise, check with a doctor first; otherwise, start gently and let the first week be easier than you think it should be.",
  },
  {
    q: "How soon will I notice a difference?",
    a: "Mood and energy: within the first week or two. Stamina: two to three weeks. Visible changes: six to eight weeks, sometimes a little longer at 50+ because recovery is slower — which is normal, not a sign it isn't working. The most reliable early win is quieter: the day a session stops being a negotiation.",
  },
];

const jsonLd = guideJsonLd({
  headline: "A Dance Challenge for Women Over 40 (and 50)",
  description:
    "Honest guidance for getting back in shape at 40+: recovery realities, why structure wins, and what dance does and doesn't cover.",
  slug: "dance-challenge-women-over-40",
  faq: FAQ,
});

export default function Over40ChallengeGuide() {
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
          A dance challenge for women over 40 (and 50)
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Getting back in shape at 45 doesn&apos;t need a different kind of
          exercise — it needs a different kind of plan. Your 40s and 50s
          reward consistency over intensity, structure over willpower, and
          low-impact over heroics, which happens to be exactly what a
          well-built dance challenge provides. Here&apos;s what genuinely
          changes at this age, what dance covers brilliantly, and the one
          thing it doesn&apos;t replace.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What actually changes in your 40s and 50s
            </h2>
            <p className="mt-4">
              Three things, none of them dramatic. Research shows muscle mass
              declines gradually from our 30s onward and the loss speeds up
              with each decade; bone density follows a similar slow slope
              from around 40. And recovery genuinely takes longer — where a
              25-year-old bounces back from a hard session in a day, a
              45-year-old often needs two or three.
            </p>
            <p className="mt-4">
              The practical conclusion isn&apos;t &ldquo;do less.&rdquo;
              It&apos;s &ldquo;stop training like sporadic
              twenty-something.&rdquo; The approach that fails hardest at
              this age is the January special — nothing for months, then
              five brutal sessions in a week, then injury or exhaustion.
              What works is the opposite shape: moderate, regular, planned
              recovery. Which is why the challenge format fits this decade
              better than any other.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why a structured challenge beats &ldquo;just exercise
              more&rdquo;
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  It removes the daily decision.
                </span>{" "}
                At this stage of life the scarce resource isn&apos;t
                capability — it&apos;s decision energy. &ldquo;Today&apos;s
                session&rdquo; asks nothing but pressing play.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Rest days are built in, not earned.
                </span>{" "}
                A good challenge schedules recovery — which your 40s
                actually require — instead of treating it as slacking.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  It&apos;s sized for consistency.
                </span>{" "}
                Short sessions three to four times a week outperform
                sporadic intensity for lasting results — and they survive
                real calendars with jobs and families in them.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  A finish line you can see.
                </span>{" "}
                Three weeks is a promise you can keep to yourself — and
                keeping it is the thing that rebuilds trust with exercise
                after years away.
              </li>
            </ul>
          </section>

          <GuideFigure
            src="/guide-over40-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, smiling in a close-up dance pose"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What dance covers well at this age
            </h2>
            <p className="mt-4">
              More than most exercise, and more than it gets credit for.
              Moderate-intensity cardio without the joint impact of running
              or jump-heavy HIIT. Balance and coordination — the abilities
              that quietly matter more every decade, and that treadmills and
              bikes never train. Mood, reliably, from session one. And the
              underrated one: enjoyment, which is not a bonus feature but
              the single best predictor that you&apos;ll still be exercising
              in a year. At 40+, the workout you like <em>is</em> the
              effective workout, because it&apos;s the one that keeps
              happening.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What dance doesn&apos;t replace (said honestly)
            </h2>
            <p className="mt-4">
              Strength work. Muscle and bone respond to load, and from 40
              onward that response is worth actively courting — dancing
              provides only light loading. This isn&apos;t a reason to
              panic-buy a gym membership; it&apos;s a &ldquo;pair,
              don&apos;t panic&rdquo; note. Build the dance habit first —
              the habit is the hard part — then add two short strength
              sessions a week: bodyweight or a pair of dumbbells at home is
              a legitimate start. A cardio habit you love plus a little
              deliberate strength covers what this decade actually asks
              for.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Starting safely (without babying yourself)
            </h2>
            <p className="mt-4">
              You&apos;re not fragile — but your first week sets the tone.
              Start with sessions that feel almost too easy; finish wanting
              more. Keep everything low-impact until your joints have voted.
              Shrink any move that complains, and treat sharp pain — as
              opposed to muscle effort — as a stop sign. Take the rest days
              even when you feel great, because at this age they&apos;re
              where the progress is actually manufactured. And if
              you&apos;re carrying an injury or a condition, have the quick
              doctor conversation first — a formality for most, but a
              sensible one.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="dance-challenge-women-over-40" />
      </article>
    </div>
  );
}
