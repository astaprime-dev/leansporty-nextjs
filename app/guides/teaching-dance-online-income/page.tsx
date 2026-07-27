import type { Metadata } from "next";
import {
  GuideEyebrow,
  GuideFaq,
  GuideRelated,
  GuideTeachCta,
} from "@/components/guides/guide-blocks";
import { guideJsonLd, type GuideFaqItem } from "@/lib/guides";

export const metadata: Metadata = {
  title: "How Much Can You Earn Teaching Dance Online? Honest Math",
  description:
    "What a €15 class seat actually pays you, how many students €500/month takes, how platform cuts compare, and when the money arrives — real numbers, no hype.",
  alternates: { canonical: "/guides/teaching-dance-online-income" },
  openGraph: {
    title: "How Much Can You Earn Teaching Dance Online? Honest Math",
    description:
      "Per-seat payouts, the €500/month math, platform-cut comparison, and payout timing — real numbers, no hype.",
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
    q: "How much do online dance instructors make per class?",
    a: "It depends on seats sold, not on a wage. Per seat on Lean Sporty: a €10 seat pays you €6.50, a €15 seat €9.76, a €25 seat €16.26 (80% of the price after VAT). So one live class with 20 attendees at €15 pays about €195 — and unlike a studio fee, thirty attendees would pay half again more, because there's no room limit.",
  },
  {
    q: "How many students do I need to earn €500 a month?",
    a: "At €15 a seat: about 52 sold seats a month — roughly 13 attendees a week across your online classes. With a €49 recorded program instead: about 16 sales a month. Mixing both is how most instructors get there: live classes bring the regulars, the program catches everyone who can't make the time slot.",
  },
  {
    q: "What percentage do platforms take from instructors?",
    a: "Ranges vary widely across the creator economy — YouTube keeps about 45% of ad revenue, app stores historically took 30%, OnlyFans keeps 20%. Lean Sporty keeps 20% of the after-VAT price (15% for featured instructors). The number to watch when comparing platforms is whether the advertised percentage is taken before or after VAT and payment costs — an '80%' of gross that still owes VAT is much less than 80% of net.",
  },
  {
    q: "When and how do online teaching earnings get paid out?",
    a: "On Lean Sporty: monthly, straight to your bank — via your own free Stripe account in the EU/EEA, UK, Switzerland, US, and Canada, or by manual bank transfer elsewhere. Balances under €20 roll into the next month, and every payout comes with a downloadable statement listing each sale.",
  },
  {
    q: "Is teaching dance online profitable for a beginner instructor?",
    a: "If you already have students, yes — modestly at first. Your first online month typically mirrors the size of your existing audience: a teacher with 15 loyal studio students might sell 10–20 online seats. What makes it compound is that the work is reusable: the class you taught in March can still be selling as a recording in August. What makes it fail is expecting a platform, any platform, to supply the audience for you.",
  },
];

const jsonLd = guideJsonLd({
  headline: "How Much Can You Earn Teaching Dance Online? Honest Math",
  description:
    "Per-seat payouts, the €500/month math, platform-cut comparison, and payout timing — real numbers, no hype.",
  slug: "teaching-dance-online-income",
  faq: FAQ,
  datePublished: "2026-07-27",
});

const SEAT_TABLE = [
  { price: "€5 (minimum)", you: "€3.25", twenty: "€65" },
  { price: "€10", you: "€6.50", twenty: "€130" },
  { price: "€15", you: "€9.76", twenty: "€195" },
  { price: "€25", you: "€16.26", twenty: "€325" },
];

export default function TeachingIncomeGuide() {
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
          How much can you earn teaching dance online?
        </h1>

        <p className="mt-6 text-lg font-light leading-relaxed text-gray-900">
          Search this question and you&apos;ll find two kinds of answers:
          dreamy ("six figures from your living room!") and useless ("it
          depends"). Here&apos;s the third kind — the actual arithmetic, using
          Lean Sporty&apos;s real rates, so you can put your own numbers in
          and see what&apos;s realistic for you.
        </p>

        <div className="mt-10 space-y-12 text-base font-light leading-relaxed text-gray-600">
          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              What one seat actually pays you
            </h2>
            <p className="mt-4">
              On Lean Sporty you set one price per class or program, students
              pay it VAT-included, and you keep <strong>80% of the price
              after VAT</strong> (featured instructors 85%). "After VAT"
              matters: for an EU sale, roughly a fifth of the sticker price is
              tax that belongs to the tax office, and the platform pays it for
              you. Per seat:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      Seat price (student pays)
                    </th>
                    <th className="py-2 pr-4 font-semibold text-gray-900">
                      You receive
                    </th>
                    <th className="py-2 font-semibold text-gray-900">
                      20 attendees pay you
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SEAT_TABLE.map((r) => (
                    <tr key={r.price} className="border-b border-pink-100/60">
                      <td className="py-2 pr-4 font-semibold text-gray-900">
                        {r.price}
                      </td>
                      <td className="py-2 pr-4">{r.you}</td>
                      <td className="py-2">{r.twenty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              EU rates shown (VAT backed out at the standard rate). Sales to
              buyers outside EU VAT — a US student, say — carry no EU VAT, so
              your 80% applies to more of the price and your share is higher.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The €500-a-month math
            </h2>
            <p className="mt-4">
              Working backwards from a goal makes the effort concrete. €500 a
              month is roughly: <strong>52 seats at €15</strong> (about 13
              attendees a week — one healthy weekly class, or two smaller
              ones), or <strong>16 sales of a €49 program</strong>, or any mix
              — say, 8 attendees a week live plus 6 program sales a month.
              Double the audience and the same effort is €1,000; that&apos;s
              the difference between selling hours and selling seats.
            </p>
            <p className="mt-4">
              A recorded program deserves special mention in this math: a live
              class earns once per teaching hour, but a program is taught once
              and sold indefinitely — every additional sale costs you nothing.
              That&apos;s why the instructors who grow fastest treat every
              live class as future program material.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              How the cut compares
            </h2>
            <p className="mt-4">
              For calibration, the shares the big creator platforms leave
              their creators: YouTube pays about 55% of ad revenue, app stores
              historically left 70%, OnlyFans leaves 80% of gross. Lean
              Sporty leaves <strong>80% of the after-VAT price</strong> — in
              the OnlyFans band — and the platform&apos;s 20% covers what
              you&apos;d otherwise buy separately: payment processing, EU VAT
              handling as the seller of record, video hosting and streaming,
              and monthly payouts with statements. If you compare platforms,
              always ask the same question: eighty percent <em>of what</em> —
              gross before tax and fees, or the money that actually exists
              after them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              When the money arrives
            </h2>
            <p className="mt-4">
              Earnings accrue per sale and are paid out monthly to your bank —
              through your own free Stripe account in the EU/EEA, UK,
              Switzerland, US, and Canada, or by manual bank transfer
              elsewhere. Balances under €20 roll into the next month rather
              than triggering micro-transfers, and every payout produces a
              statement listing each sale, like the statements YouTube or
              OnlyFans creators download.
            </p>
          </section>

          <section>
            <h2 className="font-display text-balance text-3xl font-light text-gray-900">
              The honest variables
            </h2>
            <p className="mt-4">
              Everything above is arithmetic; these are the unknowns that
              decide your actual number. Audience size — your first online
              students come from people who already know you, so a teacher
              with an active Instagram or a full studio roster starts faster
              than one without. Consistency — a weekly class that always
              happens outsells a brilliant class that happens sometimes. And
              price confidence — beginners routinely undercharge; €10–15 a
              seat is a normal price for a live class from a real instructor,
              and charging €5 doesn&apos;t double your attendance, it just
              halves your income.
            </p>
          </section>
        </div>

        <GuideTeachCta />
        <GuideFaq faq={FAQ} />
        <GuideRelated currentSlug="teaching-dance-online-income" />
      </article>
    </div>
  );
}
