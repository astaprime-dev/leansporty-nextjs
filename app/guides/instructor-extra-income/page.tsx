import type { Metadata } from "next";
import {
  GuideEyebrow,
  GuideFaq,
  GuideRelated,
  GuideTeachCta,
} from "@/components/guides/guide-blocks";
import { guideJsonLd, type GuideFaqItem } from "@/lib/guides";

export const metadata: Metadata = {
  title: "How Dance & Fitness Instructors Earn Extra Income Online",
  description:
    "The four realistic ways instructors earn more — extra studio hours, YouTube, 1:1 online coaching, and selling your own classes — compared honestly, with real numbers.",
  alternates: { canonical: "/guides/instructor-extra-income" },
  openGraph: {
    title: "How Dance & Fitness Instructors Earn Extra Income Online",
    description:
      "Extra studio hours, YouTube, 1:1 coaching, or selling your own classes online — an honest comparison with real numbers.",
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
    q: "How can a fitness or dance instructor make extra money?",
    a: "Four realistic paths: teach more hours at studios (immediate but capped by your calendar and body), build a YouTube channel (free reach, but ad money needs a very large audience), coach 1:1 online (better hourly rate, still trading hours for money), or sell your own classes and programs online (the only option where one hour of work can be sold to many people). Most instructors who meaningfully grow their income combine studio teaching with selling their own classes online.",
  },
  {
    q: "Can you make money teaching dance online?",
    a: "Yes, and the math is simple: an online class has no room-size limit, so the same hour you'd teach for a flat studio fee can be sold seat by seat. On Lean Sporty, a €15 online class seat pays the instructor €9.76 (80% of the price after VAT) — so 20 attendees earn about €195 from one hour, and the recording can keep selling afterwards.",
  },
  {
    q: "Do I need a big social media following to earn online?",
    a: "You need students, not fame. Most instructors' first online attendees are people who already know them: current studio students, regulars who moved away, and their existing Instagram followers. A few hundred genuine followers who actually take your classes beat tens of thousands of passive ones. What a following changes is speed, not possibility.",
  },
  {
    q: "Is selling recorded fitness programs worth it?",
    a: "It's the closest thing this profession has to earning while you sleep, with an honest caveat: recordings only sell if someone brings buyers to them — your audience, or the platform's. A recorded program priced at €49 pays a Lean Sporty instructor €31.87 per sale, and unlike a live class it can sell next month without you working next month.",
  },
  {
    q: "How much extra can an instructor realistically earn per month?",
    a: "Honest answer: it scales with the audience you can reach, from an extra ~€100 a month (one small weekly online class) to a serious second income. As a concrete anchor: ~52 sold seats a month at €15 — about 13 attendees a week — is roughly €500/month at Lean Sporty's 80%-after-VAT rate. Nobody serious can promise you a number; anyone who does is selling something.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How Dance & Fitness Instructors Earn Extra Income Online",
  description:
    "Extra studio hours, YouTube, 1:1 coaching, or selling your own classes online — an honest comparison with real numbers.",
  slug: "instructor-extra-income",
  faq: FAQ,
  datePublished: "2026-07-27",
});

const OPTIONS = [
  {
    option: "More studio hours",
    speed: "Immediate",
    ceiling: "Hard cap — your calendar and body",
    keep: "Flat fee per class, whatever the room holds",
  },
  {
    option: "YouTube channel",
    speed: "Slow (years)",
    ceiling: "High, but ad pay needs huge viewership",
    keep: "Roughly half of ad revenue, after joining the partner program",
  },
  {
    option: "1:1 online coaching",
    speed: "Fast if you have students",
    ceiling: "Capped — still hours for money",
    keep: "Most of the fee, minus payment and call tools",
  },
  {
    option: "Selling your own classes & programs",
    speed: "First sales in weeks",
    ceiling: "Uncapped seats; recordings resell",
    keep: "On Lean Sporty: 80% of every sale after VAT",
  },
];

export default function InstructorExtraIncomeGuide() {
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
          How dance and fitness instructors earn extra income online
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          The studio model has a built-in ceiling: you're paid per class, the
          room holds only so many people, and your body holds only so many
          classes a week. Every realistic way to earn more works around one of
          those limits. Here are the four options instructors actually use,
          compared honestly — including the numbers most articles skip.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The four realistic options
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Option
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      First money
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Ceiling
                    </th>
                    <th className="py-2 font-semibold text-gray-900">
                      What you keep
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map((r) => (
                    <tr key={r.option} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.option}
                      </td>
                      <td className="py-2 pr-4">{r.speed}</td>
                      <td className="py-2 pr-4">{r.ceiling}</td>
                      <td className="py-2">{r.keep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Why "more hours" and "YouTube" disappoint
            </h2>
            <p className="mt-4">
              Extra studio classes are the honest default — immediate money,
              zero setup — but they deepen the problem instead of solving it:
              you're still selling hours, and hours don't scale. Most
              instructors who go this route hit fatigue before they hit their
              income goal.
            </p>
            <p className="mt-4">
              YouTube looks like the opposite — record once, earn forever — but
              the ad economics are brutal for small channels: monetization only
              starts after a substantial subscriber and watch-time threshold,
              and even then ad revenue per view is measured in fractions of a
              cent. YouTube is a superb <em>discovery</em> channel for an
              instructor — a terrible <em>payment</em> channel until you're
              genuinely big. Use it to be found, not to be paid.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Selling your own classes: the one that scales
            </h2>
            <p className="mt-4">
              An online class removes the room limit: the same hour you teach
              for a flat fee at a studio can be sold seat by seat to anyone,
              anywhere, and the recording can keep selling after you've gone to
              bed. The catch — and it's a real one — is that "selling online"
              normally means becoming a small business overnight: a checkout,
              EU VAT on digital sales, invoices, video hosting, a streaming
              setup, refund handling.
            </p>
            <p className="mt-4">
              That's the part a platform exists to absorb. On Lean Sporty, you
              set one price and teach; the platform runs checkout, collects and
              remits the VAT as the seller of record, hosts the videos, streams
              the live classes, and pays out your share monthly to your bank —
              with a statement generated for you, like the big creator
              platforms do. You keep <strong>80% of every sale after VAT</strong>{" "}
              (featured instructors 85%). Concretely: a €15 class seat pays you
              €9.76; a €49 recorded program pays you €31.87 per sale; 20 people
              in one live class is about €195 for the hour.
            </p>
            <p className="mt-4">
              The honest caveat, stated plainly: no platform conjures students
              from nothing. Your first online attendees will mostly be people
              who already know you — studio regulars, ex-students who moved,
              your Instagram followers. The platform turns an audience into
              income; building the audience is still teaching&apos;s oldest
              job.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              A sensible way to combine them
            </h2>
            <p className="mt-4">
              The pattern that works isn&apos;t choosing one option — it&apos;s
              stacking them by role. Keep studio classes as your base income
              and your recruiting ground. Use Instagram or YouTube as the free
              discovery layer. Then convert that attention into online class
              seats and program sales, which is where an extra hour actually
              multiplies. Start with one weekly online class at a modest price
              for your existing students, and let the recording become your
              first program.
            </p>
          </section>
        </div>

        <GuideTeachCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="instructor-extra-income" />
      </article>
    </div>
  );
}
