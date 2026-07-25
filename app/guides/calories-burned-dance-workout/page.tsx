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
  title: "How Many Calories Does a Dance Workout Burn?",
  description:
    "A 30-minute dance workout burns roughly 150–250 calories for most people — about 175 for a 70 kg woman at moderate intensity. Honest MET-based numbers by body weight and session length.",
  alternates: { canonical: "/guides/calories-burned-dance-workout" },
  openGraph: {
    title: "How Many Calories Does a Dance Workout Burn?",
    description:
      "Honest, MET-based calorie numbers for dance workouts — by body weight and session length, compared to walking and jogging.",
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
    q: "Is dancing or walking better for burning calories?",
    a: "Minute for minute, moderate dancing burns slightly more than brisk walking (about 5 METs vs 4.3), and energetic dance-fitness burns roughly as much as jogging (around 7 METs) — without the joint impact. But the honest answer is: the one you'll still be doing in two months burns more.",
  },
  {
    q: "How accurate are smartwatch calorie numbers?",
    a: "Treat them as rough estimates — studies consistently find wrist devices can be off by 20–30% or more for calorie burn, especially for activities with lots of arm movement like dancing. They're useful for comparing your own sessions over time, not as exact numbers.",
  },
  {
    q: "Do I keep burning calories after the workout ends?",
    a: "A little. The 'afterburn' effect (EPOC) is real but small for moderate cardio — usually in the range of a few percent of what the session itself burned. It's a nice bonus, not something to plan around.",
  },
  {
    q: "How many calories do I need to burn to lose weight?",
    a: "Roughly 7,000 kcal of deficit corresponds to about 1 kg of body fat. A realistic dance habit (say four 30-minute sessions a week) contributes on the order of 700–1,000 kcal weekly — meaningful support, but food choices move the needle more. Exercise is better at changing your fitness, energy, and shape than at outrunning a diet.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How Many Calories Does a Dance Workout Burn?",
  description:
    "Honest, MET-based calorie numbers for dance workouts — by body weight and session length, compared to walking and jogging.",
  slug: "calories-burned-dance-workout",
  faq: FAQ,
});

/**
 * kcal ≈ MET × kg × hours, rounded to the nearest 5.
 * Moderate dance ≈ 5 METs; energetic dance-fitness ≈ 7 METs.
 */
const TABLE = [
  { kg: 60, m15: 75, m30: 150, m45: 225, e30: 210 },
  { kg: 70, m15: 90, m30: 175, m45: 260, e30: 245 },
  { kg: 80, m15: 100, m30: 200, m45: 300, e30: 280 },
  { kg: 90, m15: 115, m30: 225, m45: 340, e30: 315 },
];

export default function CaloriesDanceWorkoutGuide() {
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
          How many calories does a dance workout burn?
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          A 30-minute dance workout burns roughly 150–250 calories for most
          people — about 175 for a 70 kg woman at moderate intensity, and up
          to around 315 for a heavier person in an energetic session. Those
          are honest, formula-based estimates, not marketing numbers; here
          they are worked out properly, by body weight and session length.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The honest math, in one paragraph
            </h2>
            <p className="mt-4">
              Calorie estimates come from METs (metabolic equivalents), the
              standard unit exercise science uses for activity intensity. The
              formula is simple:{" "}
              <span className="font-semibold text-gray-900">
                calories ≈ MET × body weight in kg × hours
              </span>
              . General dancing rates about 5 METs; energetic dance-fitness
              sessions rate around 7. So a 70 kg woman dancing moderately for
              half an hour burns about 5 × 70 × 0.5 ≈ 175 kcal. Scaled to a
              full hour, that&apos;s roughly 350 kcal at moderate intensity
              and around 490 in an energetic session — in line with published
              per-hour ranges, minus the inflated high end often quoted.
              Every number below comes from that formula — and every calorie
              figure you see anywhere carries a real margin of error, so read
              them as ±20%.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Calories burned dancing, by weight and time
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Body weight
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      15 min moderate
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      30 min moderate
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      45 min moderate
                    </th>
                    <th className="py-2 font-semibold text-gray-900">
                      30 min energetic
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE.map((r) => (
                    <tr key={r.kg} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.kg} kg
                      </td>
                      <td className="py-2 pr-4">~{r.m15} kcal</td>
                      <td className="py-2 pr-4">~{r.m30} kcal</td>
                      <td className="py-2 pr-4">~{r.m45} kcal</td>
                      <td className="py-2">~{r.e30} kcal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Estimates from the MET formula (moderate ≈ 5 METs, energetic ≈ 7
              METs), rounded. Individual burn varies with fitness, effort, and
              how much of the session you actually move.
            </p>
          </section>

          <GuideFigure
            src="/guide-calories-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, mid-jump in a dance workout"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How dancing compares to other cardio
            </h2>
            <p className="mt-4">
              Using the same formula for a 70 kg woman over 30 minutes: brisk
              walking (4.3 METs) burns about 150 kcal, moderate dancing (5
              METs) about 175, jogging (7 METs) about 245 — and an energetic
              dance session sits right at jogging&apos;s level, around 245,
              with far less impact on knees and hips. Dancing isn&apos;t a
              &ldquo;light&rdquo; alternative to real cardio; done with
              energy, it <em>is</em> real cardio.
            </p>
            <p className="mt-4">
              Style shifts the number more than people expect. Energetic
              styles like Zumba, hip-hop, or fast salsa run at roughly 7–9
              METs — our &ldquo;energetic&rdquo; column or a bit above —
              while gentler ballroom styles sit closer to a brisk walk at
              3–4. And if you&apos;ve seen claims that dancing out-burns
              running or cycling: that&apos;s only true at a comparably hard
              effort. MET for MET, running still edges out dance — what
              dancing wins on is that people actually keep doing it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The number that actually matters
            </h2>
            <p className="mt-4">
              No single session&apos;s calorie count changes your body — the
              weekly total does. Four 30-minute energetic sessions add up to
              roughly 1,000 kcal a week for a 70 kg woman. Whether that shows
              up on the scale depends mostly on what you eat; roughly 7,000
              kcal of deficit corresponds to a kilogram of fat, so exercise
              alone moves slowly.
            </p>
            <p className="mt-4">
              Here&apos;s the honest reframe: the calorie chart is the least
              interesting thing dance gives you. Stamina, mood, coordination,
              and — above all — a cardio habit you don&apos;t have to force
              yourself into are what change how you look and feel. The best
              calorie burner is the workout that still exists in your life in
              March.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="calories-burned-dance-workout" />
      </article>
    </div>
  );
}
