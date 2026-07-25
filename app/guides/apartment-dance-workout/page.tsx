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
  title: "Apartment Dance Workouts: Quiet and Small-Space",
  description:
    "Yes, you can dance-workout in an apartment without a neighbor complaint. What actually travels through floors, the moves to adapt, the rug trick, and how much room a dance session really needs.",
  alternates: { canonical: "/guides/apartment-dance-workout" },
  openGraph: {
    title: "Apartment Dance Workouts: Quiet and Small-Space",
    description:
      "What your downstairs neighbor actually hears, the swaps that keep choreography quiet, and the floor-plan math for dancing at home.",
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
    q: "Can I really do dance cardio in an apartment?",
    a: "Yes — step-based dance cardio with no jumps produces about as much floor noise as purposeful walking. The moves that cause complaints are landings: jumps, leaps, and heavy heel strikes. Keep both feet low, land heel-to-toe when a move does come down, and an apartment session is a non-event for the building.",
  },
  {
    q: "What's the quietest time to do a dance workout?",
    a: "Daytime and early evening, when the building's background noise masks footfall. There's no universal rule, but floors are most audible early morning and late night against a quiet building — if your only slot is 6am, that's exactly when step-only, no-jump sessions earn their keep.",
  },
  {
    q: "Do rugs or mats actually help the neighbors below?",
    a: "For thuds, yes. Impact noise travels through the structure of the building, and a dense rug or thick mat under your dance zone cushions the source before it reaches the floor. It does little for airborne sound like music — so soften the landings and keep the speaker at a reasonable level rather than relying on the rug for everything.",
  },
  {
    q: "Will my neighbors always hear something?",
    a: "Honestly: it depends on the building more than on you. A thick concrete slab swallows footsteps that a springy old wooden floor broadcasts. What you control is the impact you create — and a no-jump dance session creates very little. If you can walk around your flat without complaints, you can dance a step-based workout in it.",
  },
  {
    q: "My downstairs neighbor already complained — what's the cheapest fix?",
    a: "Three moves, in order: switch fully to no-jump sessions (the biggest win, free), put a dense rug or interlocking mats under the spot where you dance, and shift sessions toward daytime. Together they remove almost all of what travels downward. A short friendly conversation about which times work also does more than any equipment.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Apartment Dance Workouts: Quiet and Small-Space",
  description:
    "What your downstairs neighbor actually hears, the swaps that keep choreography quiet, and the floor-plan math for dancing at home.",
  slug: "apartment-dance-workout",
  faq: FAQ,
});

export default function ApartmentDanceGuide() {
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
          Apartment dance workouts: quiet, small-space, neighbor-proof
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          You can absolutely dance-workout in an apartment — what you
          can&apos;t do is jump in one, and the good news is you don&apos;t
          need to. Floor noise comes almost entirely from landings, not from
          movement. Keep your feet low, put a rug under your dance zone, pick
          civilised hours, and a real cardio session becomes about as loud to
          the flat below as walking around your kitchen. Here&apos;s the
          honest physics, the space math, and the anxiety part nobody talks
          about.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What your neighbors actually hear
            </h2>
            <p className="mt-4">
              Building sound comes in two kinds, and they behave completely
              differently.{" "}
              <span className="font-semibold text-gray-900">
                Airborne sound
              </span>{" "}
              — music, your voice — weakens fast through walls and floors; at
              living-room volume it&apos;s rarely the problem.{" "}
              <span className="font-semibold text-gray-900">
                Impact sound
              </span>{" "}
              — jumps, stomps, dropped weights — is different: the thud
              enters the building&apos;s structure and travels along it,
              re-emerging as sound in the ceiling below. That&apos;s why a
              jumping jack bothers the neighbor while a much
              &ldquo;louder&rdquo; podcast doesn&apos;t.
            </p>
            <p className="mt-4">
              How much survives the trip depends on the building — thick
              concrete slabs swallow most of it, older wooden floors
              broadcast it — which is why one person dances for years
              without a complaint and another gets a broom on the ceiling in
              week one. You can&apos;t choose your slab. You can choose your
              landings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Keeping the choreography, losing the thuds
            </h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Ground the jumps.
                </span>{" "}
                Nearly every airborne move has a grounded twin: step-touch
                instead of a hop, a quick low step pattern instead of a
                leap, rising onto the balls of your feet instead of leaving
                the floor. The cardio survives; the impact doesn&apos;t.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Land heel-to-toe, not flat.
                </span>{" "}
                When a move does come down, rolling through the foot spreads
                the force over time — a soft landing is quieter downstairs
                than a flat one by a wide margin.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Rug under the dance zone.
                </span>{" "}
                A dense rug or interlocking mats cushions impact at the
                source — the one purchase that genuinely helps, and it
                doesn&apos;t need to cover the room, just where your feet
                work.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  Dance in the daytime window.
                </span>{" "}
                The same session reads differently at 2pm and 11pm. If your
                schedule forces the quiet hours, that&apos;s when strictly
                no-jump sessions matter most.
              </li>
            </ul>
          </section>

          <GuideFigure
            src="/guide-apartment-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, dancing in a compact athletic stance"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The floor-plan math for dancing
            </h2>
            <p className="mt-4">
              A dance session needs a <em>movement footprint</em>, not a
              room: enough space to take a full step in each direction and
              swing your arms without clipping a lamp — in practice, about
              two by two metres of clear floor. Add a quick spin check
              (arms out, turn once, touch nothing) and mind anything at
              head height. A coffee table pushed aside converts most living
              rooms; small-footprint choreography — the kind built from
              steps rather than travel — is designed for exactly this.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Is it really bothering them — or is it the anxiety talking?
            </h2>
            <p className="mt-4">
              Here&apos;s the part no workout article admits: many people
              tiptoe through home workouts not because anyone complained,
              but because they&apos;re pre-emptively embarrassed about
              existing audibly. Some proportion is worth keeping: a
              20–30-minute step-based session during the day is ordinary
              living noise — the same category as vacuuming — not an
              imposition. If you&apos;re genuinely unsure, the fix is
              social, not acoustic: one short, friendly &ldquo;let me know
              if you ever hear my workouts&rdquo; conversation buys more
              peace of mind than any mat. Most neighbors, asked directly,
              haven&apos;t noticed a thing.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="apartment-dance-workout" />
      </article>
    </div>
  );
}
