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
  title: "How to Start Exercising Again After Years Off",
  description:
    "The hardest part of getting back in shape isn't fitness — it's the first week. Start smaller than you think: 15–20 minutes at home, something you enjoy. What to expect week by week, honestly.",
  alternates: { canonical: "/guides/start-exercising-again-after-years" },
  openGraph: {
    title: "How to Start Exercising Again After Years Off",
    description:
      "Why restarting feels so hard, what to expect week by week, and the mistakes that end most comebacks.",
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
    q: "How unfit is too unfit to start?",
    a: "If you can walk around your home, you can start — follow-along home workouts scale all the way down, because you can pause anytime, shrink any movement, and go at your own speed. Check with a doctor first if you have a chronic condition, high blood pressure, are pregnant, get chest pain or dizziness with exertion, or if it's been many years since you exercised regularly — a quick conversation, not a hurdle.",
  },
  {
    q: "Should I lose weight before I start exercising?",
    a: "No — this is backwards, and it delays people for years. Exercise is for everybody at every weight, it improves health independently of weight change, and movement now makes everything easier later. Start moving; let food handle the scale.",
  },
  {
    q: "How sore should I be after my first workouts back?",
    a: "Mild, all-over muscle soreness that peaks a day or two after a session and fades within another day is normal — it's your muscles adapting. Soreness so strong you dread moving means the session was too big; make the next one smaller, don't quit. Sharp or one-sided joint pain is different: that's a see-a-doctor signal, not a soreness.",
  },
  {
    q: "What if I've tried to restart before and quit?",
    a: "Then you're normal — most people restart several times before it sticks. The fix is usually not more willpower but a smaller plan: shorter sessions, at home, at a fixed time, doing something you actually enjoy. Quitting doesn't erase what you learned, and the cost of another restart is one 15-minute session.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How to Start Exercising Again After Years Off",
  description:
    "Why restarting feels so hard, what to expect week by week, and the mistakes that end most comebacks.",
  slug: "start-exercising-again-after-years",
  faq: FAQ,
});

export default function StartExercisingAgainGuide() {
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
          How to start exercising again after years off
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          The hardest part of getting back in shape isn&apos;t fitness —
          it&apos;s the first week. The restart that works is almost always
          smaller than the one you&apos;re planning: 15–20 minutes, at home,
          three times a week, doing something you actually enjoy. Fitness
          returns faster than you fear; the only thing you have to protect is
          the habit.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why restarting feels so much harder than starting
            </h2>
            <p className="mt-4">
              Three things gang up on you. First, the memory of your old
              shape — you know what you used to manage, so everything now
              feels like failure instead of a starting point. Second,
              all-or-nothing thinking: if you can&apos;t do it
              &ldquo;properly&rdquo; (an hour, a gym, five days a week), some
              part of you decides it&apos;s not worth doing at all. Third,
              the gym itself — after years away, walking into a room of
              people who never left is genuinely intimidating.
            </p>
            <p className="mt-4">
              None of this means anything is wrong with you. It means the
              restart has to be designed around those three facts: private,
              small, and impossible to fail.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Start smaller than your pride wants
            </h2>
            <p className="mt-4">
              For the first month, the only metric that matters is:{" "}
              <span className="font-semibold text-gray-900">
                did you come back?
              </span>{" "}
              Not calories, not minutes, not effort. A 15-minute home session
              you repeat on Thursday beats a punishing hour you spend the
              next four days recovering from and quietly resenting.
            </p>
            <p className="mt-4">
              That&apos;s also why <em>enjoyment</em> is a training variable,
              not a luxury. Pick the movement you look forward to — dancing
              in your living room, walking with a podcast, whatever it is —
              because in month one you&apos;re not training your heart yet.
              You&apos;re training the habit of showing up, and nobody shows
              up twice a week for something they hate.
            </p>
            <p className="mt-4">
              Don&apos;t overthink the cardio-versus-strength split yet
              either. Both matter eventually, but a dance session already
              works your legs and core; if you want to add anything in month
              one, a couple of bodyweight moves afterwards is plenty. And the
              days in between sessions aren&apos;t wasted — rest is when your
              body actually adapts.
            </p>
          </section>

          <GuideFigure
            src="/guide-restart-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, smiling warmly"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What to expect, week by week
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">Week 1:</span>{" "}
                awkward and humbling, with some next-day soreness. Give
                yourself a couple of easy minutes at the start and end of
                each session — that&apos;s what keeps the first weeks
                injury-free. This week is about proving to yourself
                you&apos;ll press play — nothing else.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Weeks 2–3:
                </span>{" "}
                the first honest wins — better mood after every session, more
                energy during the day, often better sleep. Sessions stop
                feeling like a negotiation.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Weeks 6–8:
                </span>{" "}
                measurable fitness — stairs feel different, you last a full
                session without pausing, clothes sit a little differently.
                This is when most people realize the habit has quietly become
                part of the week.
              </li>
            </ul>
            <p className="mt-4">
              Anyone promising visible transformation in two weeks is selling
              something. This timeline is slower — and it&apos;s real. One
              honest addendum: if you&apos;ve been away for years rather than
              months, stretch it. The habit still locks in around week 6–8,
              but feeling fully like yourself again can take a season, not
              two months. That&apos;s normal, not a sign it isn&apos;t
              working.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The mistakes that end most restarts
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Going too hard on day one.
                </span>{" "}
                The brutal first session feels virtuous and guarantees a
                miserable week two. Finish your early sessions feeling like
                you could have done more.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Treating a missed day as a broken streak.
                </span>{" "}
                A missed day is a missed day. The restart dies when one
                missed session becomes &ldquo;I&apos;ve ruined it,&rdquo;
                which becomes three months.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Weighing yourself daily.
                </span>{" "}
                The scale is the slowest, noisiest signal you have. Mood,
                energy, and stamina improve weeks earlier — track those.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Comparing yourself to the person you were.
                </span>{" "}
                You&apos;re not competing with 25-year-old you. You&apos;re
                competing with the version of this month where you didn&apos;t
                start.
              </li>
            </ul>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="start-exercising-again-after-years" />
      </article>
    </div>
  );
}
