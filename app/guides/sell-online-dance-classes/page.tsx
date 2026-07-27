import type { Metadata } from "next";
import {
  GuideEyebrow,
  GuideFaq,
  GuideRelated,
  GuideTeachCta,
} from "@/components/guides/guide-blocks";
import { guideJsonLd, type GuideFaqItem } from "@/lib/guides";

export const metadata: Metadata = {
  title: "How to Sell Online Dance Classes: A Practical Guide",
  description:
    "What you need (a phone and a plan), live vs recorded, what to charge, and the unglamorous part nobody mentions — payments, EU VAT, and invoices — handled.",
  alternates: { canonical: "/guides/sell-online-dance-classes" },
  openGraph: {
    title: "How to Sell Online Dance Classes: A Practical Guide",
    description:
      "Equipment, live vs recorded, pricing, and who handles payments, VAT, and invoices — the practical path from teaching to selling.",
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
    q: "What equipment do I need to teach dance classes online?",
    a: "Less than you think: a phone or laptop with a decent camera, daylight or one affordable light, enough floor space to demonstrate, and music. A tripod at hip height beats a fancy camera badly positioned. Upgrade only when students ask for something specific — nobody has ever left a class because it wasn't shot in 4K.",
  },
  {
    q: "How do I collect payments for online classes?",
    a: "Two routes. Do-it-yourself: set up a payment provider account, a checkout page, EU VAT registration for digital sales, and invoicing — real work before the first euro. Or teach on a platform that sells the class as the merchant of record: students pay the platform, it handles VAT and receipts, and you receive your share as a payout. On Lean Sporty that share is 80% of the price after VAT, paid monthly to your bank.",
  },
  {
    q: "Do I need to register a business to sell dance classes online?",
    a: "It depends on your country and your volume, and it's worth one conversation with a local accountant. Many countries have small-scale allowances — Poland's 'unregistered activity' rules, for example, let individuals earn below a monthly threshold without registering a company. Teaching through a platform also simplifies your side: the platform sells to the students and handles their VAT; you're paid as a contractor.",
  },
  {
    q: "How much should I charge for an online dance class?",
    a: "€10–15 per live class seat is a normal, defensible price from a real instructor; €25+ fits specialized or small-group formats; recorded multi-week programs commonly sell for €30–60. The classic beginner mistake is charging €5 'to be safe' — it doesn't meaningfully increase attendance, it just tells people the class is worth €5.",
  },
  {
    q: "Can I sell recordings of my classes?",
    a: "Yes — and you should, because recordings are how one taught hour becomes repeatable income. Two formats work: the recording of a live class sold as on-demand, and a deliberately structured multi-session program. One practical warning: use music you have the right to use commercially, since a music-rights claim can take down content on any platform.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How to Sell Online Dance Classes: A Practical Guide",
  description:
    "Equipment, live vs recorded, pricing, and who handles payments, VAT, and invoices — the practical path from teaching to selling.",
  slug: "sell-online-dance-classes",
  faq: FAQ,
  datePublished: "2026-07-27",
});

const FORMATS = [
  {
    format: "Live online class",
    good: "Energy, regulars, weekly rhythm; sells on a schedule",
    consider: "You must show up; attendance follows your time zone",
  },
  {
    format: "Recorded program",
    good: "Teach once, sell indefinitely; buyers keep access",
    consider: "Needs structure and light editing; sells on your audience",
  },
  {
    format: "Live + recording (hybrid)",
    good: "The live class becomes tomorrow's product automatically",
    consider: "Best default — most platforms record live classes for you",
  },
];

export default function SellOnlineClassesGuide() {
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
          How to sell online dance classes: a practical guide
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          You already have the hard part — you can teach. What&apos;s left is
          logistics: a camera, a format, a price, and a way for strangers to
          pay you that doesn&apos;t turn you into an accountant. This guide
          covers each, including the tax-and-payments part most articles
          quietly skip.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The setup you actually need
            </h2>
            <p className="mt-4">
              A phone or laptop with a decent camera on a stable surface at
              hip height, daylight from the front (or one cheap softbox),
              space to demonstrate a few steps, and your music. Test your
              framing once: full body visible, face readable. That&apos;s
              genuinely it — production quality matters far less than being
              easy to follow, and every hour spent shopping for gear is an
              hour not spent filling your first class.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Live, recorded, or both
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Format
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Why it works
                    </th>
                    <th className="py-2 font-semibold text-gray-900">
                      Worth knowing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FORMATS.map((r) => (
                    <tr key={r.format} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.format}
                      </td>
                      <td className="py-2 pr-4">{r.good}</td>
                      <td className="py-2">{r.consider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Start live: it needs no editing, your regulars will come, and on
              a platform that records automatically, every live class quietly
              builds your on-demand catalog.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Pricing without apologizing
            </h2>
            <p className="mt-4">
              €10–15 a seat is a normal price for a live online class from a
              real instructor — comparable to a studio drop-in, minus the
              commute. Specialized or small-group formats justify €25 and up;
              structured multi-week programs commonly sell at €30–60 as a
              one-time purchase. Resist the €5 reflex: a rock-bottom price
              doesn&apos;t double attendance, it just halves your income and
              quietly tells people the class is worth little. (On Lean Sporty
              the minimum paid price is €5 precisely so the advertised 80%
              share stays true even on the cheapest seat.)
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The part nobody mentions: payments, VAT, invoices
            </h2>
            <p className="mt-4">
              Selling a class to an EU consumer is legally selling a digital
              service: someone must run the checkout, charge the right
              country&apos;s VAT, remit it, and issue receipts. Doing that
              yourself means a payment-provider account, a checkout page, VAT
              registration and returns, and bookkeeping — before your first
              sale. It&apos;s all doable; it&apos;s just not teaching.
            </p>
            <p className="mt-4">
              The platform route moves that burden wholesale: the platform
              sells the class as the merchant of record, handles VAT and
              receipts for every buyer, hosts and streams the video, and pays
              you your share. On Lean Sporty you keep{" "}
              <strong>80% of every sale after VAT</strong> (featured
              instructors 85%), paid monthly to your bank — via your own free
              Stripe account across the EU/EEA, UK, Switzerland, US, and
              Canada, or manual transfer elsewhere — with a downloadable
              statement per payout. Your side of the paperwork is one settings
              page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              Selling it: start with the audience you have
            </h2>
            <p className="mt-4">
              Your first paying online students are almost never strangers —
              they&apos;re your studio regulars, the student who moved cities,
              the followers who watch every story but have never met you.
              Announce a weekly online class where they already listen to you:
              class link in the Instagram bio, a story the day before and an
              hour before, a personal message to the five people most likely
              to come. Ten warm invitations outperform a hundred cold posts —
              and one committed weekly class, kept without fail, compounds
              into regulars, recordings, and referrals.
            </p>
          </section>
        </div>

        <GuideTeachCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="sell-online-dance-classes" />
      </article>
    </div>
  );
}
