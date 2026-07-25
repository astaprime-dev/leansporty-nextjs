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
  title: "Low-Impact Cardio Without Jumping (At Home)",
  description:
    "Low-impact means one foot stays on the floor — not that the workout is easy. How step-based dance cardio at home raises your heart rate with no jumping, no knee pounding, and no noise for the neighbors.",
  alternates: { canonical: "/guides/low-impact-cardio-no-jumping" },
  openGraph: {
    title: "Low-Impact Cardio Without Jumping",
    description:
      "Knee-friendly, apartment-quiet cardio that still gets your heart rate up — low-impact doesn't mean easy.",
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
    q: "What's the difference between low-impact and low-intensity?",
    a: "Impact is the force that goes through your joints when your feet hit the floor; intensity is how hard your heart and lungs are working. They're independent: a walk in the park is low-impact and low-intensity, while a fast step-based dance session is low-impact and genuinely moderate-to-high intensity. You can be gentle on your knees and still be out of breath.",
  },
  {
    q: "Can low-impact cardio help with weight loss?",
    a: "Yes — calorie burn follows intensity, not impact. A moderate step-based dance session burns roughly the same as any other moderate cardio (around 150–200 kcal per 30 minutes for most people). As always, weight loss depends mostly on food; the cardio supports it and improves fitness either way.",
  },
  {
    q: "Will my downstairs neighbors hear a no-jump dance workout?",
    a: "Step-based dancing is about as loud as someone walking around their flat — there are no landings, which are what actually travel through floors. If you skip the jumps (or the workout has none), you can train at any hour without being 'that' neighbor.",
  },
  {
    q: "Is dancing or walking better for sensitive knees?",
    a: "Both are low-impact and knee-friendly for most people. Dancing adds coordination, balance, and variety that walking doesn't, and it's easier to do in bad weather. Whichever you choose: soften or skip any specific move that hurts, and see a doctor about persistent pain rather than training through it.",
  },
];

const jsonLd = guideJsonLd({
  headline:
    "Low-Impact Cardio Without Jumping (Knee-Friendly, Apartment-Quiet)",
  description:
    "Knee-friendly, apartment-quiet cardio that still gets your heart rate up — low-impact doesn't mean easy.",
  slug: "low-impact-cardio-no-jumping",
  faq: FAQ,
});

export default function LowImpactCardioGuide() {
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
          Low-impact cardio without jumping
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Low-impact cardio means one foot stays on the floor — it does not
          mean the workout is easy. Step-based dance cardio raises your heart
          rate into the same moderate zone as brisk walking or light jogging,
          with no jumping, no pounding through your knees, and almost no
          noise for anyone living below you. Here&apos;s how that works and
          who it&apos;s for.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Low-impact is not low-intensity
            </h2>
            <p className="mt-4">
              These two get mixed up constantly, and the confusion keeps
              people jumping when they&apos;d rather not.{" "}
              <span className="font-semibold text-gray-900">Impact</span> is
              the landing force that travels through your ankles, knees, and
              hips when your feet hit the ground — running and jump-based
              HIIT are high-impact by definition.{" "}
              <span className="font-semibold text-gray-900">Intensity</span>{" "}
              is how hard your cardiovascular system is working, and it
              doesn&apos;t care whether you ever leave the floor.
            </p>
            <p className="mt-4">
              A fast step-based dance session can push you to the same
              breathlessness as a jog while your joints experience little
              more than a purposeful walk. That&apos;s the whole trick — and
              it&apos;s why &ldquo;I can&apos;t jump&rdquo; is not a reason
              to skip cardio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How to get your heart rate up without leaving the floor
            </h2>
            <p className="mt-4">
              Intensity without impact comes from four dials, and dance
              choreography turns all of them naturally:
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>
                <span className="font-semibold text-gray-900">
                  Bigger movements.
                </span>{" "}
                A wide step-touch works far more muscle than a small one;
                deep steps and lunging patterns more still.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Arms up.</span>{" "}
                Anything above shoulder height raises heart rate quickly —
                dance uses arms constantly, not as an afterthought.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Tempo.</span>{" "}
                Moving to the beat keeps you at a steady, honest pace — the
                music doesn&apos;t let you drift into coasting.
              </li>
              <li>
                <span className="font-semibold text-gray-900">
                  No standing around.
                </span>{" "}
                Choreography flows from move to move, so your heart rate
                stays up the whole session instead of spiking and resting.
              </li>
            </ul>
            <p className="mt-4">
              In practice these are ordinary, named moves — step-touches,
              grapevines, marches, low kicks, side lunges — strung together
              to music. Three or four sessions a week comfortably covers the
              standard guideline of about 150 minutes of moderate cardio.
            </p>
          </section>

          <GuideFigure
            src="/guide-lowimpact-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, in a deep controlled stretch"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Kind to your knees — and your neighbors
            </h2>
            <p className="mt-4">
              Every jump ends in a landing, and landings send a multiple of
              your body weight through your joints — that&apos;s fine for
              healthy joints in sensible doses, but it&apos;s exactly what
              aching knees, your floor, and the people below it object to.
              Step-based cardio removes the landings entirely: no impact
              spikes for your joints, and nothing thudding through the
              ceiling downstairs. For apartment living that&apos;s the
              difference between training whenever you like and negotiating
              with your building.
            </p>
            <p className="mt-4">
              Swimming, cycling, and the elliptical are low-impact too, and
              they&apos;re all good options. Dance&apos;s edge is logistical:
              it needs no pool, no bike, no machine — just floor space and a
              screen, which is why it&apos;s the one that survives busy weeks.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Who should still be careful
            </h2>
            <p className="mt-4">
              Low-impact is gentle, not magic. If you have an existing
              injury, joint disease like arthritis, or pain that shows up
              when you exercise,
              talk to a doctor or physiotherapist before starting anything
              new — including this. And within any workout, the rule is
              boring but reliable: soften or skip the specific move that
              hurts, and never train through sharp pain. Follow-along videos
              make that easy, because you can shrink any movement and stay
              with the session.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="low-impact-cardio-no-jumping" />
      </article>
    </div>
  );
}
