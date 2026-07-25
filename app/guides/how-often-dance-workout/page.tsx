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
  title: "How Often Should You Do Dance Workouts?",
  description:
    "3–4 sessions of 15–30 minutes a week is the honest baseline — then adjust by goal. Frequency by goal, why rest days matter, and whether dancing every day is too much.",
  alternates: { canonical: "/guides/how-often-dance-workout" },
  openGraph: {
    title: "How Often Should You Do Dance Workouts?",
    description:
      "The definitive frequency answer: a goal-by-goal table, the recovery logic behind it, and the truth about dancing every day.",
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
    q: "How many times a week should I dance to lose weight?",
    a: "Four to five sessions of 30–45 minutes gives you roughly 1,000–1,500 calories of weekly burn — meaningful support, though what you eat still decides most of the outcome. More useful than chasing a magic frequency: pick the number of sessions you can genuinely repeat every week, because a sustainable four beats a heroic six you abandon in week three.",
  },
  {
    q: "Is it OK to dance every day?",
    a: "Daily gentle movement is fine — daily maximum effort isn't. If you love dancing every day, alternate: energetic sessions two to four times a week, easy low-impact 'just move' sessions in between. Your fitness improves during recovery, so stacking hard days back to back mostly stacks fatigue.",
  },
  {
    q: "How many rest days do I need between dance workouts?",
    a: "After an energetic session, give the same muscles roughly a day or two before the next hard one — the common guidance is 48–72 hours between demanding sessions. Light sessions need much less. In practice, the classic every-other-day rhythm handles this automatically without any tracking.",
  },
  {
    q: "Can you overtrain from dancing?",
    a: "From gentle dancing, practically no. From daily energetic sessions on top of a stressful life, yes — the signs are persistent tiredness, worse sleep, clumsier coordination, and fading motivation. Those are signals to add rest days, not push harder; if they persist despite resting, it's worth mentioning to a doctor.",
  },
  {
    q: "Is 30 minutes of dancing a day enough?",
    a: "More than enough — 30 minutes of moderate dancing daily is about 210 weekly minutes, comfortably past the 150-minute guideline, and roughly 150–250 calories per session. If you do it daily, keep most sessions moderate rather than all-out so recovery keeps up.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How Often Should You Do Dance Workouts?",
  description:
    "The definitive frequency answer: a goal-by-goal table, the recovery logic behind it, and the truth about dancing every day.",
  slug: "how-often-dance-workout",
  faq: FAQ,
});

const TABLE = [
  {
    goal: "Just starting (or restarting)",
    freq: "2–3× / week",
    len: "15–20 min",
    note: "Consistency first; add sessions once showing up feels normal",
  },
  {
    goal: "General health & mood",
    freq: "3–4× / week",
    len: "15–30 min",
    note: "Meets the ~150-min weekly guideline with a walk or two",
  },
  {
    goal: "Weight-loss support",
    freq: "4–5× / week",
    len: "30–45 min",
    note: "≈1,000–1,500 kcal/week; eating still decides most of it",
  },
  {
    goal: "Building stamina",
    freq: "4–6× / week",
    len: "Mixed",
    note: "Alternate energetic and easy days; rest is part of the plan",
  },
];

export default function HowOftenDanceGuide() {
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
          How often should you do dance workouts?
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          For most people: three to four sessions of 15–30 minutes a week —
          enough to cover most of the standard 150 minutes of weekly moderate
          cardio and to see stamina change within a few weeks. But the honest
          answer depends on your goal, which is why every site you&apos;ve
          checked gives a different number. Here&apos;s the full picture, by
          goal, with the recovery logic that the one-number answers skip.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Frequency by goal
            </h2>
            <p className="mt-4">
              The conflicting advice out there (&ldquo;2–3 times!&rdquo;,
              &ldquo;5 times!&rdquo;, &ldquo;daily!&rdquo;) mostly comes from
              pages answering different questions — weight loss, skill,
              general health — with different intensities in mind. Matched to
              goal, the numbers stop conflicting:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Goal
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Sessions
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Length
                    </th>
                    <th className="py-2 font-semibold text-gray-900">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE.map((r) => (
                    <tr key={r.goal} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.goal}
                      </td>
                      <td className="py-2 pr-4">{r.freq}</td>
                      <td className="py-2 pr-4">{r.len}</td>
                      <td className="py-2">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Ranges, not prescriptions — the best frequency is the highest
              one you can repeat every week without dreading it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why more isn&apos;t automatically better
            </h2>
            <p className="mt-4">
              Fitness doesn&apos;t improve during workouts — it improves
              between them, while your body repairs and adapts. That&apos;s
              why the general guidance is to give the same muscles about
              48–72 hours between genuinely hard sessions, and why every
              well-designed program schedules rest instead of demanding
              daily heroics. Skipping recovery doesn&apos;t speed results;
              it stacks fatigue until sessions get worse instead of better.
            </p>
            <p className="mt-4">
              The signals you need more rest are unglamorous but reliable:
              persistent tiredness, worse sleep, coordination getting
              clumsier instead of sharper, and motivation quietly draining.
              Those mean &ldquo;add a rest day,&rdquo; not &ldquo;try
              harder&rdquo; — and if they persist even with rest, mention it
              to a doctor.
            </p>
          </section>

          <GuideFigure
            src="/guide-frequency-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, in a wide lunge with one arm extended"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Is dancing every day too much?
            </h2>
            <p className="mt-4">
              Not if you vary the effort. Daily movement is one of the best
              habits there is — the trap is making every day a maximum-effort
              day. The sustainable version of &ldquo;I dance every
              day&rdquo; alternates energetic sessions (two to four a week)
              with easy, low-impact ones where the goal is just to move and
              enjoy the music. Hard days build fitness; easy days build the
              habit; rest days let both stick.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              A weekly rhythm that actually works
            </h2>
            <p className="mt-4">
              A realistic starter template: energetic sessions Monday,
              Wednesday, Friday; a walk or gentle session on one or two of
              the days between; weekend fully off or an easy dance for fun.
              That&apos;s 60–90 minutes of real cardio, recovery handled
              automatically, and nothing to track. Start at the
              &ldquo;starting out&rdquo; row of the table, hold it for two
              or three weeks, and only then add — frequency you add after
              the habit exists tends to stay; frequency you start with
              usually doesn&apos;t survive week two.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="how-often-dance-workout" />
      </article>
    </div>
  );
}
