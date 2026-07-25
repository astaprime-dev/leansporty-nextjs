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
  title: "Too Embarrassed to Dance, Even Alone at Home?",
  description:
    "Feeling watched with nobody there is a documented quirk of the mind, not a personal flaw. Why dancing feels more exposing than other exercise — and the format changes that actually dissolve it.",
  alternates: { canonical: "/guides/embarrassed-to-dance" },
  openGraph: {
    title: "Too Embarrassed to Dance, Even Alone at Home?",
    description:
      "Why solo dancing feels exposing (the psychology is real), and what actually kills the feeling — format changes, not pep talks.",
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
    q: "Is it normal to feel embarrassed dancing alone at home?",
    a: "Completely. Psychologists have names for it — the 'spotlight effect' (we overestimate how much others notice us) and the 'imaginary audience' (the mind simulates observers even when none exist). Feeling silly dancing alone doesn't mean anything is wrong with you; it means your brain is running its social software at the wrong moment.",
  },
  {
    q: "Why do I feel watched when nobody is there?",
    a: "Because embarrassment doesn't actually require an audience — research on the emotion shows an imagined one is enough. Your mind keeps a lifelong habit of picturing how you look from the outside, and unfamiliar, expressive movement like dancing switches that habit on hard. It's a normal cognitive bias, and it weakens with repetition.",
  },
  {
    q: "Does this mean I have social anxiety?",
    a: "Feeling self-conscious about dancing is normal-range self-consciousness, not a disorder — nearly everyone has some version of it. Social anxiety is broader and more persistent, affecting many areas of life; if that sounds like your experience, talking to a professional is worthwhile. For the dancing itself, format changes usually do the job.",
  },
  {
    q: "Will the embarrassment go away on its own?",
    a: "With repetition, yes — and faster than you'd expect. The feeling is strongest in the first minutes of the first session and fades as the movement becomes familiar; most people report it's mostly gone within a handful of sessions. What doesn't work is waiting to feel confident before starting — the confidence is a result of the reps, not a prerequisite.",
  },
  {
    q: "What makes follow-along workouts different?",
    a: "They change where your attention points. Dancing freestyle, your mind watches yourself — the exposing part. Following an instructor, your mind is busy copying: eyes on the screen, brain on the next move. There's no choreography to perform, no mirror required, and nothing to get 'right' in front of anyone. Attention outward is the practical cure for self-watching.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Too Embarrassed to Dance, Even Alone at Home?",
  description:
    "Why solo dancing feels exposing (the psychology is real), and what actually kills the feeling — format changes, not pep talks.",
  slug: "embarrassed-to-dance",
  faq: FAQ,
});

export default function EmbarrassedToDanceGuide() {
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
          Too embarrassed to dance — even alone at home?
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Feeling watched when nobody is there isn&apos;t silly, and it
          isn&apos;t rare — it&apos;s a documented quirk of how minds work.
          Embarrassment doesn&apos;t need a real audience; an imagined one is
          enough, and dancing summons that imagined audience harder than
          almost any other exercise. The fix isn&apos;t a pep talk. It&apos;s
          a handful of format changes that quietly remove what triggers the
          feeling — and then repetition finishes the job.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The &ldquo;solo audience&rdquo; is a real phenomenon
            </h2>
            <p className="mt-4">
              Psychology has two well-established names for what&apos;s
              happening. The{" "}
              <span className="font-semibold text-gray-900">
                spotlight effect
              </span>{" "}
              is our tendency to drastically overestimate how much other
              people notice about us. The{" "}
              <span className="font-semibold text-gray-900">
                imaginary audience
              </span>{" "}
              is the mind&apos;s habit of simulating observers — running the
              &ldquo;how do I look right now?&rdquo; program even behind a
              locked door. Researchers studying embarrassment have found it
              doesn&apos;t require anyone actually present; the imagined
              audience is enough to produce the full blush.
            </p>
            <p className="mt-4">
              So if you&apos;ve ever started dancing in your kitchen and
              stopped two moves in feeling absurd — that wasn&apos;t evidence
              you&apos;re uniquely awkward. That was standard-issue human
              social software firing at the wrong moment.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why dance feels more exposing than a squat
            </h2>
            <p className="mt-4">
              Nobody feels silly doing push-ups alone. That&apos;s because
              push-ups are judged by count, and dancing — in our heads — is
              judged by <em>looks</em>. Psychologists call the underlying
              habit self-objectification: viewing your own body from an
              imagined outside camera instead of from the inside. Expressive
              movement flips that camera on, which is why the feeling is
              &ldquo;I look ridiculous&rdquo; rather than &ldquo;this is
              hard.&rdquo; Mirrors make it worse — exercise research
              consistently finds mirrored rooms increase self-consciousness
              for beginners, which is worth remembering next time a workout
              video tells you to practice in front of one.
            </p>
            <p className="mt-4">
              The tell that this is all framing: the same step done as
              &ldquo;exercise&rdquo; (a step-touch, a knee lift) feels
              completely fine. It&apos;s not the movement that&apos;s
              exposing. It&apos;s the word &ldquo;dancing.&rdquo;
            </p>
          </section>

          <GuideFigure
            src="/guide-embarrassed-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, smiling over her shoulder mid-move"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What actually kills the feeling
            </h2>
            <p className="mt-4">
              Not affirmations. Not &ldquo;dance like nobody&apos;s
              watching&rdquo; on a poster. What works is removing the
              triggers:
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Follow, don&apos;t perform.
                </span>{" "}
                Copying an instructor points your attention outward — eyes on
                the screen, brain on the next move. The self-watching that
                fuels embarrassment needs attention to run on; a follow-along
                starves it.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Skip the mirror.
                </span>{" "}
                You don&apos;t need one to follow a video — and without it,
                the outside camera has nothing to look through.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Close the actual door.
                </span>{" "}
                Trivial, but the imagined audience quiets down when the
                real-world possibility of being walked in on is zero.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Music up.
                </span>{" "}
                Loud enough to follow the beat and the room stops feeling
                like a stage and starts feeling like the workout it is.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What the first sessions honestly feel like
            </h2>
            <p className="mt-4">
              Minute one still feels a little absurd — expect that, and start
              anyway. By minute ten you&apos;re too busy keeping up to
              spectate yourself; that&apos;s the follow-along format doing
              its job. Session by session the absurdity shrinks, not because
              you talked yourself into confidence but because familiarity
              starved the feeling out. Most people find it&apos;s simply gone
              within a handful of sessions — replaced, somewhat annoyingly,
              by the discovery that dancing in your living room is fun, which
              is the thing the embarrassment was standing in front of all
              along.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="embarrassed-to-dance" />
      </article>
    </div>
  );
}
