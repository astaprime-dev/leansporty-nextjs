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
  title: "Dance Workouts for Complete Beginners at Home",
  description:
    "How to start dance workouts at home with zero experience: what a follow-along video is, what you need (almost nothing), what your first session feels like, and how to make it stick.",
  alternates: { canonical: "/guides/beginner-dance-workout-at-home" },
  openGraph: {
    title: "Dance Workouts for Complete Beginners at Home",
    description:
      "No equipment, no experience, no gym — everything you need to start dancing at home, honestly explained.",
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
    q: "How much space do I need for a dance workout at home?",
    a: "About two by two metres — enough to take a step in each direction and stretch your arms out without hitting anything. A living room with the coffee table pushed aside is plenty. You don't need a mirror, a mat, or special flooring.",
  },
  {
    q: "What should I wear for my first dance workout?",
    a: "Anything stretchy you can move in, plus supportive sneakers. That's it — nobody sees you, so there's no outfit to get right. If you're dancing on a slippery floor, sneakers also keep you stable.",
  },
  {
    q: "I have two left feet — can I really do this?",
    a: "Yes. Follow-along workouts are not performances: you copy simple moves from a video, and missing a step costs you nothing — the workout keeps going and so do you. Coordination is a skill that improves with repetition, and everyone is clumsy in session one.",
  },
  {
    q: "How long should a beginner dance workout be?",
    a: "15–30 minutes is the sweet spot. It's long enough to raise your heart rate and break a sweat, and short enough that you'll actually do it again in two days — which matters far more than the length of any single session.",
  },
  {
    q: "Are dance workouts actually effective for beginners?",
    a: "Yes — dance-fitness sessions are genuine moderate-intensity cardio, roughly comparable to brisk walking or light jogging depending on how energetic the session is. They also train coordination and balance, which most beginner cardio doesn't.",
  },
  {
    q: "Can dance workouts help with weight loss?",
    a: "They burn real calories — roughly 150–250 per 30-minute session for most people — but weight loss depends on your whole week, mostly what you eat, not on any single workout. Treat dance as the cardio you'll actually keep doing, not as a fix on its own.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Dance Workouts for Complete Beginners at Home (No Equipment)",
  description:
    "No equipment, no experience, no gym — everything you need to start dancing at home, honestly explained.",
  slug: "beginner-dance-workout-at-home",
  faq: FAQ,
});

export default function BeginnerDanceWorkoutGuide() {
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
          Dance workouts for complete beginners at home
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          To start dance workouts at home you need three things: about two
          metres of floor space, a phone or laptop, and 15–30 minutes. No
          equipment, no experience, no gym membership, no rhythm required. You
          press play, copy the instructor on screen, and that&apos;s the whole
          workout — here&apos;s honestly what it&apos;s like.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What does &ldquo;follow-along&rdquo; actually mean?
            </h2>
            <p className="mt-4">
              A follow-along workout is a video where the instructor does the
              full session with you, in real time, facing the camera. You copy
              her movements as they happen — there&apos;s no choreography to
              memorize, no counting, no &ldquo;now practice this
              sequence.&rdquo; If she steps left, you step left.
            </p>
            <p className="mt-4">
              It also means you don&apos;t have to pick a genre before you
              start. Zumba, hip-hop, Latin, dance cardio — for a beginner the
              style matters far less than the format: follow-along, at your
              pace, at home. Choose by whether the music and the instructor
              make you want to move.
            </p>
            <p className="mt-4">
              This is the single most beginner-friendly format in fitness,
              because the two things beginners fear — being watched and being
              lost — are designed out. Nobody is watching, and you can&apos;t
              get lost: the next move is always right there on screen. Miss a
              step? The workout keeps going, and so do you. You can also
              pause, rewind a section, or slow down whenever you want, which
              no live class lets you do.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What you need — and what you don&apos;t
            </h2>
            <p className="mt-4">
              You need: a clear patch of floor roughly two by two metres,
              something stretchy to wear, supportive sneakers, water, and a
              screen — a phone propped on a shelf works fine, a laptop or TV
              is more comfortable.
            </p>
            <p className="mt-4">
              You don&apos;t need: weights, a mat, a mirror, dance shoes, a
              sports bra upgrade, or any prior experience. There is genuinely
              nothing to buy — which also means there&apos;s nothing to wait
              for. The classic beginner trap is preparing to start instead of
              starting; with dance workouts the preparation is moving a coffee
              table.
            </p>
          </section>

          <GuideFigure
            src="/guide-beginner-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, mid dance move"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Your first session: what it honestly feels like
            </h2>
            <p className="mt-4">
              The first ten minutes feel awkward. You&apos;ll be half a beat
              behind, your arms and legs will occasionally disagree, and
              you&apos;ll laugh at yourself at least once. This is not a sign
              it isn&apos;t working — it&apos;s what learning any new movement
              feels like, and it fades faster than you expect.
            </p>
            <p className="mt-4">
              By the end of a 20–30 minute session you&apos;ll be genuinely
              warm and probably sweating — dance workouts are real cardio, not
              a warm-up pretending to be one. The next day you might feel
              light muscle soreness in your calves and thighs if you
              haven&apos;t exercised in a while. That&apos;s normal and fades
              in a day or two; sharp pain is not normal and means a move needs
              softening. One more first-session tip: let the opening minutes
              be gentler — a good follow-along builds the warm-up in, so
              don&apos;t skip ahead to the fast part cold.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How to make it stick after day one
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Attach it to a time slot.
                </span>{" "}
                &ldquo;After the kids are in bed&rdquo; or &ldquo;before my
                shower&rdquo; beats &ldquo;when I have time&rdquo; — which is
                never.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Three short sessions beat one heroic one.
                </span>{" "}
                15–30 minutes, three or four times a week, is the rhythm that
                builds a habit. One exhausting hour on Sunday builds a dread.
                And the rest days in between aren&apos;t slacking — they&apos;re
                when the soreness fades and the next session gets easier.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  A missed day is a missed day — nothing more.
                </span>{" "}
                It doesn&apos;t erase progress and it doesn&apos;t need to be
                &ldquo;made up.&rdquo; Just do the next session.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Judge it by how you feel, not the scale.
                </span>{" "}
                In the first weeks the honest wins are mood, energy, and
                stamina — those show up long before anything else changes.
              </li>
            </ul>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="beginner-dance-workout-at-home" />
      </article>
    </div>
  );
}
