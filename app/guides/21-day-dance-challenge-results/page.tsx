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
  title: "21-Day Dance Challenge Results: What to Expect",
  description:
    "What three weeks of short daily dance workouts realistically changes: better stamina and mood, the start of a habit, modest visible change — not a transformation. The honest week-by-week timeline.",
  alternates: { canonical: "/guides/21-day-dance-challenge-results" },
  openGraph: {
    title: "21-Day Dance Challenge Results: What to Expect",
    description:
      "The honest week-by-week timeline of a 21-day dance challenge — what changes, what doesn't, and what the habit science really says.",
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
    q: "Can you get in shape in 21 days?",
    a: "You can get noticeably fitter — better stamina, easier stairs, sessions that stop leaving you breathless — but not fully 'in shape' from zero. Measurable cardio improvements start around weeks two to three; the bigger transformations you see advertised take months. What 21 days reliably delivers is momentum and proof that you can stick with something.",
  },
  {
    q: "How much weight can you lose with a 21-day dance challenge?",
    a: "From the workouts alone: modest. Fifteen short sessions burn roughly 2,000–3,000 calories in total, which corresponds to about a third of a kilogram of body fat. If you also tidy up eating habits, 1–2 kg over three weeks is realistic. Any program promising dramatic weight loss from dancing alone in 21 days is overpromising.",
  },
  {
    q: "Does it really take 21 days to form a habit?",
    a: "No — that's a myth. The best-known study on habit formation (University College London, 2009) found new habits take 66 days on average to feel automatic, with a range from 18 to 254 days. What 21 days does do is get you through the hardest phase — the start — and prove to yourself that you can show up repeatedly. A 21-day challenge is a habit-starter, not a habit-guarantee.",
  },
  {
    q: "What happens after the 21 days end?",
    a: "The rhythm you built is the real result — keep it. Repeat your favorite sessions, or keep the same time slots with any movement you enjoy. (In our challenge, your access lasts a full year exactly so the program doesn't vanish the day the streak ends.)",
  },
  {
    q: "Is a 21-day challenge better than a 30-day one?",
    a: "The length matters less than the design: session size you can repeat, rest days built in, and beginner pacing. Twenty-one days is long enough to feel real change and prove consistency, and short enough that most people can see the finish line — which is exactly why unstructured 30-day playlists lose people halfway.",
  },
];

const jsonLd = guideJsonLd({
  headline: "21-Day Dance Challenge Results: What to Expect",
  description:
    "The honest week-by-week timeline of a 21-day dance challenge — what changes, what doesn't, and what the habit science really says.",
  slug: "21-day-dance-challenge-results",
  faq: FAQ,
});

export default function TwentyOneDayResultsGuide() {
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
          What actually happens in a 21-day dance challenge
        </h1>

        {/* The quotable answer — first paragraph, no throat-clearing. */}
        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          In 21 days of short dance workouts you can realistically expect:
          noticeably better stamina, a reliable mood lift after every session,
          the beginnings of visible tone — and, most valuable of all, proof
          that you can stick with something. What you should not expect is a
          transformation photo. Here is the honest week-by-week timeline,
          including the part most challenges won&apos;t tell you about habit
          science.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The honest week-by-week timeline
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Days 1–7: awkward, then easier.
                </span>{" "}
                The first sessions feel clumsy and a little humbling — that
                fades faster than you expect. The mood lift, though, shows up
                from day one: finishing a session reliably feels better than
                not starting it. Some next-day muscle soreness is normal if
                you&apos;ve been away from exercise.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Days 8–14: the moves click.
                </span>{" "}
                Choreography you fumbled in week one starts landing without
                thought, and that&apos;s not just satisfying — it&apos;s your
                coordination measurably improving. Stamina follows: sessions
                that winded you now just warm you up. Many people also notice
                they sleep better.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Days 15–21: it becomes yours.
                </span>{" "}
                Sessions feel shorter than the clock says, your posture and
                energy read differently, and the first hints of visible tone
                appear in legs and core. The bigger change is quieter: the
                workout slot has become part of your week instead of a
                negotiation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Will you lose weight in 21 days?
            </h2>
            <p className="mt-4">
              Here&apos;s the math nobody puts on their sales page. A
              three-week dance challenge of fifteen short sessions adds up to
              roughly four to six hours of moderate cardio — about 2,000–3,000
              calories in total, depending on your weight and energy. In pure
              calorie terms that&apos;s around a third of a kilogram of body
              fat. Real, but modest.
            </p>
            <p className="mt-4">
              So the scale is the wrong place to look in week three. What
              changes first is how clothes sit, how stairs feel, and how much
              energy you have at 4pm. If weight loss is your goal, the
              challenge&apos;s job is to install the exercise habit while your
              eating does the heavier lifting — and three weeks of feeling
              better is, in practice, what makes people start eating better
              too.
            </p>
          </section>

          <GuideFigure
            src="/guide-21day-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, laughing mid-workout with her hair flying"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Does 21 days really build a habit? (The honest answer)
            </h2>
            <p className="mt-4">
              You&apos;ve probably heard &ldquo;it takes 21 days to form a
              habit.&rdquo; It&apos;s a myth — the number comes from a 1960s
              self-help book, not research. The best-known actual study
              (University College London, 2009) found habits take{" "}
              <span className="font-semibold text-gray-900">
                66 days on average
              </span>{" "}
              to become automatic, with a range from 18 to 254 days depending
              on the person and the habit.
            </p>
            <p className="mt-4">
              So why run a 21-day challenge at all? Because the hardest part
              of any habit is not day 60 — it&apos;s days one through twenty,
              when every session is a decision. Three weeks is long enough to
              get you through that phase, prove you can restart, and carve
              out the time slot. A good challenge is a habit-starter with a
              finish line you can actually see; the automatic part comes in
              the weeks after, and by then you&apos;re no longer starting
              from zero.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why challenges work when routines fail
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  No decisions.
                </span>{" "}
                &ldquo;Do today&apos;s session&rdquo; removes the planning
                that kills most routines — what workout, how long, is this
                even working. The structure decides; you just press play.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  A visible finish line.
                </span>{" "}
                &ldquo;Exercise forever&rdquo; is a demand; &ldquo;21
                days&rdquo; is a deal. Time-boxing makes the commitment small
                enough to actually make.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Rest days on purpose.
                </span>{" "}
                Good challenges schedule recovery instead of demanding daily
                heroics — which is why a well-built 21 days has sessions{" "}
                <em>plus</em> rest days, not 21 straight workouts.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Honest session sizes.
                </span>{" "}
                The challenges people finish are built from 10–20 minute
                sessions, not hour-long punishments. Finishing day 4 tired
                but willing is the whole design goal.
              </li>
            </ul>
            <p className="mt-4">
              The honest caveat: mid-challenge dropout is normal everywhere —
              day 10 to 15 is where most people quietly stop, usually because
              sessions were too long or progress felt invisible. If you pick
              a challenge (any challenge), pick one designed by someone who
              planned for that week.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="21-day-dance-challenge-results" />
      </article>
    </div>
  );
}
