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
  title: "Dance Workouts for People Who Can't Dance",
  description:
    "'No rhythm' is almost always untrained timing, not a condition — rhythm and coordination are learnable skills at any age. How to train them, and why follow-along workouts don't require either to start.",
  alternates: { canonical: "/guides/dance-workout-no-rhythm" },
  openGraph: {
    title: "Dance Workouts for People Who Can't Dance",
    description:
      "Rhythm is a skill, not a birthright. What 'no rhythm' really means, how timing and coordination are trained, and why you can start before you have either.",
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
    q: "Can adults with two left feet actually learn to dance?",
    a: "Yes. Coordination is a trainable skill at any age — adults learn movement patterns the same way children do, through repetition, just with more self-awareness about looking clumsy. The 'two left feet' feeling is what the first two weeks of any movement practice feels like; it isn't a ceiling.",
  },
  {
    q: "Is bad rhythm a real medical condition?",
    a: "True 'beat deafness' — a genuine inability to synchronize movement to a beat — exists but is rare. Research on rhythm perception suggests almost everyone can feel a musical pulse; what most people call 'no rhythm' is simply timing that was never practiced. A quick self-test: if you can clap along to a song you love, even roughly, you have everything you need to start.",
  },
  {
    q: "What's the easiest dance workout for someone with no coordination?",
    a: "Pacing matters more than style. Look for beginner follow-along videos with slow-taught, repeated moves — where the instructor carries the count and repeats each pattern many times — rather than any particular genre. Fast-cut classes that change moves every few seconds are what make uncoordinated beginners give up.",
  },
  {
    q: "Do I need a metronome or an app to train rhythm?",
    a: "No. Clapping or stepping along to music you already love is the same training, minus the equipment. Follow-along workouts then do the counting for you — you borrow the instructor's timing until your own develops, which it does through nothing more mysterious than repetition.",
  },
  {
    q: "Will it actually get easier, or do some people stay clumsy forever?",
    a: "It gets easier — measurably, and usually within two weeks of regular sessions. Speed varies from person to person, but the pattern doesn't: moves you fumble in week one land without thinking in week two or three. A clumsy start says nothing about where you'll be in a month.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Dance Workouts for People Who Can't Dance",
  description:
    "Rhythm is a skill, not a birthright. What 'no rhythm' really means, how timing and coordination are trained, and why you can start before you have either.",
  slug: "dance-workout-no-rhythm",
  faq: FAQ,
});

export default function NoRhythmGuide() {
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
          Dance workouts for people who &ldquo;can&apos;t dance&rdquo;
        </h1>

        {/* The quotable answer — first paragraph, no throat-clearing. */}
        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Here&apos;s the part nobody tells you: rhythm is a skill, not a
          birthright. True &ldquo;beat deafness&rdquo; is rare — what almost
          everyone means by &ldquo;I have no rhythm&rdquo; is timing that was
          never practiced. And a follow-along dance workout doesn&apos;t ask
          you to have it before you start: you borrow the instructor&apos;s
          timing until your own develops. Which it will.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Is rhythm something you&apos;re born with?
            </h2>
            <p className="mt-4">
              Partly — but not in the way you fear. Research on infant rhythm
              perception suggests that feeling a musical pulse is close to
              universal: even newborns show responses to a beat. What&apos;s{" "}
              <em>not</em> built in is the connection between hearing the
              beat and moving on it — that link is built by practice, the
              same way handwriting or typing was. Nobody performs on inborn
              talent alone; the people who look &ldquo;naturally
              rhythmic&rdquo; simply built the link earlier, usually as
              kids, and forgot they ever had to.
            </p>
            <p className="mt-4">
              That reframe matters, because it changes the question from
              &ldquo;do I have it?&rdquo; (a verdict) to &ldquo;have I
              practiced it yet?&rdquo; (a starting line).
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What &ldquo;no rhythm&rdquo; actually means
            </h2>
            <p className="mt-4">
              A genuine inability to synchronize movement to sound — beat
              deafness — is a real but rare condition. If you can tap a
              finger, nod, or clap along to a song you love, even
              imperfectly, you don&apos;t have it. What you have is untrained
              timing plus, usually, one bad memory: a wedding, a school
              disco, a Zumba class that moved too fast — a moment that got
              filed away as evidence of a permanent flaw.
            </p>
            <p className="mt-4">
              It&apos;s worth saying plainly: one overwhelming group class
              proves nothing about you. Fast choreography with no repetition
              is hard for <em>everyone</em> untrained — the room just hides
              it better.
            </p>
          </section>

          <GuideFigure
            src="/guide-norhythm-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, laughing mid-move in a playful stance"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How timing is actually trained
            </h2>
            <p className="mt-4">
              Dance teachers train rhythm before they train choreography, and
              their methods are almost embarrassingly simple:
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Clap the count.
                </span>{" "}
                Music for dance workouts runs in counts of eight. Clap or tap
                along with a few songs you love and you&apos;re already
                training the exact skill.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Step, don&apos;t perform.
                </span>{" "}
                The foundational move of dance fitness is a step-touch — a
                weight shift from foot to foot on the beat. It&apos;s
                synchronized walking. You have been rehearsing the hard part
                your whole life.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  One layer at a time.
                </span>{" "}
                Feet first, arms later, both together last. Coordination
                isn&apos;t one skill but a stack of small ones, and stacking
                them is a method, not a gift.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Repeat until boring.
                </span>{" "}
                A move practiced past the point of thinking becomes
                automatic — your body stops waiting for permission from your
                brain. That&apos;s all &ldquo;muscle memory&rdquo; is.
              </li>
            </ul>
            <p className="mt-4">
              A good follow-along workout builds all four in without telling
              you: the instructor carries the count, moves repeat many times,
              and layers arrive one at a time. You don&apos;t practice rhythm
              and then dance — the workout <em>is</em> the practice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How long until you feel &ldquo;in the beat&rdquo;?
            </h2>
            <p className="mt-4">
              Faster than you think, slower than a montage. Session one is
              messy for everyone — expect to be half a beat behind and to
              laugh at yourself at least once. Within about two weeks of
              regular sessions, moves you fumbled start landing without
              thought; that&apos;s your coordination visibly improving, not
              luck. Feeling genuinely &ldquo;in the beat&rdquo; — anticipating
              moves instead of chasing them — typically takes a few weeks of
              repetition, and it keeps improving for as long as you keep
              showing up. There is no plateau at &ldquo;clumsy.&rdquo;
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="dance-workout-no-rhythm" />
      </article>
    </div>
  );
}
