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
  title: "Zumba vs Dance Fitness: What's the Difference?",
  description:
    "Zumba is one branded style of dance fitness — licensed instructors, Latin rhythms, live-follow classes. An honest comparison of formats, and what to try if Zumba felt too fast for you.",
  alternates: { canonical: "/guides/zumba-vs-dance-fitness" },
  openGraph: {
    title: "Zumba vs Dance Fitness: What's the Difference?",
    description:
      "A fair, plain-English comparison — what Zumba actually is, why it feels fast for beginners, and how home follow-along dance workouts differ.",
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
    q: "Is Zumba the same as dance fitness?",
    a: "Zumba is one branded style of dance fitness, not a synonym for it. 'Dance fitness' is the whole category — any workout built from dance movement — while Zumba is a trademarked format with licensed instructors, Latin and international music, and a specific class structure. Every Zumba class is dance fitness; most dance fitness isn't Zumba.",
  },
  {
    q: "Do you need to be a good dancer for Zumba?",
    a: "No — Zumba's own guidance says beginners should simplify moves or march in place when lost, and nobody in a class is grading you. That said, the live 'follow me in real time' format does reward some existing coordination, which is why complete beginners often feel behind for the first several classes.",
  },
  {
    q: "Can you do Zumba at home?",
    a: "Yes — Zumba has its own app with on-demand classes, plus years of DVDs and official videos. If you love the Zumba style specifically, a home option exists. The difference from generic follow-along dance workouts isn't location; it's the teaching format, music, and pace control.",
  },
  {
    q: "Is Zumba or dance cardio better for weight loss?",
    a: "At a similar effort level they burn a similar amount — both are moderate-to-energetic cardio, roughly 150–250+ calories per 30 minutes depending on your weight and intensity. No format wins on calories; the one you'll still be doing in two months wins, and weight loss itself depends mostly on eating.",
  },
  {
    q: "What is Zumba Gold?",
    a: "Zumba's official lower-intensity variant — slower pacing and simpler choreography, designed for older adults and beginners. If you want the Zumba atmosphere at a gentler speed and there's a class near you, it's a legitimate option worth knowing about.",
  },
];

const jsonLd = guideJsonLd({
  headline: "Zumba vs Dance Fitness: What's the Difference?",
  description:
    "A fair, plain-English comparison — what Zumba actually is, why it feels fast for beginners, and how home follow-along dance workouts differ.",
  slug: "zumba-vs-dance-fitness",
  faq: FAQ,
});

const TABLE = [
  {
    dim: "What it is",
    zumba: "A trademarked brand with licensed instructors",
    df: "The whole category — any workout built from dance",
  },
  {
    dim: "Music",
    zumba: "Latin & international (salsa, reggaeton, merengue)",
    df: "Anything — pop, hip-hop, disco, whatever the instructor picks",
  },
  {
    dim: "How you learn moves",
    zumba: "Follow the instructor live, little pre-teaching",
    df: "Varies; follow-along videos teach and repeat each move",
  },
  {
    dim: "Pace control",
    zumba: "The class sets the pace",
    df: "Videos: pause, rewind, slow down anytime",
  },
  {
    dim: "Setting",
    zumba: "Mostly group classes (app exists for home)",
    df: "Studio classes or at home, alone",
  },
  {
    dim: "Cost model",
    zumba: "Per class or app subscription",
    df: "Varies — classes, subscriptions, or one-time programs",
  },
  {
    dim: "Beginner ramp",
    zumba: "Jump in and keep up (or Zumba Gold)",
    df: "Beginner-paced programs can start from zero",
  },
];

export default function ZumbaVsDanceFitnessGuide() {
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
          Zumba vs dance fitness: what&apos;s the difference?
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Zumba is one style of dance fitness, not the whole thing: a
          trademarked format with licensed instructors, Latin-driven music,
          and high-energy live classes where you follow the instructor in
          real time. &ldquo;Dance fitness&rdquo; is the umbrella — every
          format from studio dance cardio to at-home follow-along programs.
          Neither is better; they suit different people, and if a Zumba class
          once left you feeling lost, that says more about the format&apos;s
          pace than about you.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What Zumba actually is
            </h2>
            <p className="mt-4">
              Zumba deserves its reputation. It&apos;s a global brand with a
              real method: classes are built from song-based intervals of
              Latin and international rhythms, taught only by instructors
              licensed through the company, with an atmosphere closer to a
              party than a gym session. For people who thrive on group
              energy and live music, it&apos;s genuinely excellent — and
              it&apos;s not studio-only: there&apos;s an official app for
              home classes, and a gentler variant called Zumba Gold with
              slower pacing for beginners and older adults.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why Zumba feels fast for beginners
            </h2>
            <p className="mt-4">
              Zumba classes generally don&apos;t pre-teach choreography — you
              copy the instructor live, song by song, and the class moves at
              the room&apos;s pace whether you&apos;ve caught the step or
              not. That&apos;s a design choice, not a flaw: it keeps the
              energy high and the party feeling intact. But it means the
              format quietly assumes some coordination, and a complete
              beginner can spend the first several classes half a move
              behind, watching everyone else&apos;s feet.
            </p>
            <p className="mt-4">
              If that was your experience, the honest takeaway isn&apos;t
              &ldquo;I can&apos;t dance.&rdquo; It&apos;s that you were
              learning in a format with no pause button.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The comparison, side by side
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900"></th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Zumba
                    </th>
                    <th className="py-2 font-semibold text-gray-900">
                      Dance fitness (category)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE.map((r) => (
                    <tr key={r.dim} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.dim}
                      </td>
                      <td className="py-2 pr-4">{r.zumba}</td>
                      <td className="py-2">{r.df}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <GuideFigure
            src="/guide-zumba-anastasiia.jpg"
            alt="Anastasiia, the Lean Sporty instructor, mid-jump with arms wide"
            caption="Anastasiia — choreographer and the instructor behind the 21-Day Dance Challenge."
          />

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What to try if Zumba didn&apos;t click
            </h2>
            <p className="mt-4">
              You have two honest options. If it was the <em>speed</em> that
              lost you but you loved the class energy, Zumba Gold keeps you
              in that world at a friendlier pace. If it was the{" "}
              <em>format</em> — learning live, in public, with no way to
              slow anything down — then a follow-along video program flips
              every one of those switches: the instructor teaches and
              repeats each move, you can pause and replay, nobody is
              watching, and a beginner program starts from actual zero
              rather than from &ldquo;keep up.&rdquo;
            </p>
            <p className="mt-4">
              Same music-driven fun, same real cardio — different learning
              mechanics for a different kind of learner. Knowing which kind
              you are is worth more than any format&apos;s marketing.
            </p>
          </section>
        </div>

        <GuideCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="zumba-vs-dance-fitness" />
      </article>
    </div>
  );
}
