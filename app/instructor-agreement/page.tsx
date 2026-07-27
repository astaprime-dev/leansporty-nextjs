import Link from "next/link";
import type { Metadata } from "next";
import { INSTRUCTOR_AGREEMENT_VERSION } from "@/lib/instructor-agreement";

export const metadata: Metadata = {
  title: "Instructor Agreement — Lean Sporty",
  description:
    "The plain-English terms of teaching on Lean Sporty: your share, payouts, recordings, and responsibilities.",
};

/**
 * Public Instructor Agreement, accepted at activation (/welcome/[code] and
 * /instructor/activate) — the API logs the accepted version. Source of truth for
 * this text: INSTRUCTOR_AGREEMENT.md at the workspace root; when it changes, update
 * this page AND bump INSTRUCTOR_AGREEMENT_VERSION in lib/instructor-agreement.ts.
 */
export default function InstructorAgreementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-pink-600 hover:text-pink-700 font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900 mb-2">
            Instructor Agreement
          </h1>
          <p className="text-gray-600">Version {INSTRUCTOR_AGREEMENT_VERSION}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-pink max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                This agreement is between <strong>Astaprime Sp. z o.o.</strong>, a company
                registered in Poland (&quot;Lean Sporty&quot;, &quot;we&quot;, &quot;us&quot;) and{" "}
                <strong>you</strong>, the instructor named in your instructor account. It applies
                from the moment you accept it during activation. It is a companion to the{" "}
                <Link href="/terms" className="text-pink-600 hover:text-pink-700">
                  Terms of Service
                </Link>{" "}
                (Section 9), which this document details.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What this relationship is</h2>
              <p className="text-gray-700 leading-relaxed">
                You are an <strong>independent instructor</strong> — not our employee, worker, or
                agent. You decide what you teach, when, and at what price. Nothing here creates
                employment, a partnership, or an agency. You confirm you are <strong>at least 18
                years old</strong> and legally able to enter this agreement.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                You provide your services <strong>on your own account, not as our employee</strong>.
                Before your first payout (Section 6) you confirm one of the following:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4 mt-4">
                <li>
                  you are <strong>not a Polish tax resident</strong> — you handle your own taxes in
                  your country; or
                </li>
                <li>
                  you have a <strong>registered business activity</strong> (in Poland: działalność
                  gospodarcza / JDG — free to register online in a day); or
                </li>
                <li>
                  you operate under Poland&apos;s <strong>unregistered small activity</strong> rules
                  (działalność nierejestrowana) and sign our short statement confirming it — no
                  registration and no ZUS needed on your side while your revenue stays within its
                  monthly limit.
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Until then you can teach free classes and set everything up — this only gates
                payouts, never teaching.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                This agreement is <strong>non-exclusive</strong>: you are free to teach anywhere
                else, in person or online. We only ask that access to content hosted on Lean Sporty
                is sold through Lean Sporty (see Section 8).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How selling works</h2>
              <p className="text-gray-700 leading-relaxed">
                Lean Sporty is the <strong>seller of record</strong>. Students buy from us: we run
                the checkout, collect the money, issue receipts, handle sales tax (VAT), refunds,
                and customer support. You, in turn, provide your teaching content and services to
                us, and we pay you the share described in Section 5. You never invoice students and
                never handle their payments.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your content and our licenses</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-3 ml-4">
                <li>
                  <strong>Your content stays yours.</strong> You keep full ownership of everything
                  you create — your videos, your programs, your live classes.
                </li>
                <li>
                  <strong>Sales license.</strong> You grant us a worldwide license to host, encode,
                  stream, display, and market your content through Lean Sporty for as long as it is
                  offered there — including free preview lessons you choose, and marketing materials
                  (thumbnails, short clips, your name, photo, and bio) used to promote your classes
                  and profile.
                </li>
                <li>
                  <strong>Buyers keep what they bought.</strong> When a student buys your class or
                  program, they keep access to it — including after you unpublish it or after this
                  agreement ends. This license survives for existing buyers.
                </li>
                <li>
                  <strong>Class recordings and the library — the heart of the deal.</strong> Your
                  live classes are recorded automatically. You grant us a{" "}
                  <strong>perpetual, worldwide, non-exclusive license</strong> to keep those
                  recordings and include them in the Lean Sporty members&apos; library —{" "}
                  <strong>including after this agreement ends</strong>. This license is why our fee
                  is 20% instead of the 30–50% other platforms charge: your recordings grow the
                  library, the library grows the audience, and that audience keeps finding
                  instructors like you. Non-exclusive means you can also use your recordings however
                  you like — including reusing them as lessons in your own paid programs here. We
                  will consider good-faith requests to remove a specific recording (for example, one
                  with a privacy problem), but we are not obliged to remove recordings simply
                  because you stop teaching with us.
                </li>
                <li>
                  <strong>What we will not do.</strong> We will not sell your recordings to third
                  parties outside the Lean Sporty service, and we will not edit them in a way that
                  misrepresents you.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Your promises about content</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  You own, or have properly licensed, everything in your content —{" "}
                  <strong>including the music</strong>. Popular recorded music usually requires a
                  license; if you are not sure, use royalty-free music. Claims arising from music or
                  other third-party material in your content are your responsibility.
                </li>
                <li>
                  <strong>
                    Everyone who appears (or is clearly heard) in your content is an adult and has
                    agreed
                  </strong>{" "}
                  to being recorded and to the recording being published and sold here — including
                  guest instructors and anyone visible in your studio or home. Keep a simple written
                  consent from each such person and show it to us if we ask. Children must not
                  appear in your content.
                </li>
                <li>
                  Your content does not infringe anyone&apos;s rights and complies with the law.
                </li>
                <li>
                  Your fitness guidance is within your competence, and you present health and
                  results claims honestly.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your share (the money)</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  <strong>You keep 80% of every sale after VAT</strong> — or{" "}
                  <strong>85% as a featured instructor</strong>. &quot;After VAT&quot; means: the
                  student&apos;s price includes VAT (sales tax); we pay that VAT to the tax office;
                  your percentage applies to what remains. Your earnings dashboard shows the exact
                  numbers for every sale.
                </li>
                <li>
                  <strong>No other deductions.</strong> No listing fee, no monthly fee, no minimum
                  fee per sale. Paid prices start at €5 for live class seats and €19 for programs
                  (below €5, a class can be free).
                </li>
                <li>
                  <strong>Your rate is locked per product.</strong> The percentage in force when you
                  create a class or program stays with it. If the standard rate ever changes, it
                  applies only to products you create afterwards — never retroactively.
                </li>
                <li>
                  <strong>Featured status</strong> is granted by us in writing (for example in your
                  invite) and applies to products you create while it is active.
                </li>
                <li>
                  <strong>Platform-sourced sales.</strong> When our own paid marketing brings a
                  buyer you did not (as disclosed on the /teach page), we may keep a larger share on
                  those specific sales. If we introduce this, we will tell you the share in advance,
                  and it will never apply to sales from your own audience.
                </li>
                <li>
                  <strong>No income promise.</strong> We do not guarantee sales, student numbers, or
                  any level of earnings — how many people show up is driven by your teaching and
                  your audience.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payouts</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  We pay your accumulated share <strong>once a month, in euros</strong> — via a
                  Stripe account in your name, or by bank transfer (SEPA) to a bank account{" "}
                  <strong>in your own name</strong>. Balances <strong>under €20 roll into the next
                  month</strong>. Before your first payout we may ask you to verify your identity (a
                  one-time check that you are who your account says).
                </li>
                <li>
                  <strong>Refunds and chargebacks.</strong> We decide refunds as seller of record,
                  in line with law and our published policies. If a sale is refunded or charged
                  back, your share of that sale is deducted from your pending balance — or from
                  future payouts if it was already paid out.{" "}
                  <strong>
                    The dispute fees charged by the payment provider are our cost, not yours
                  </strong>
                  , and buyers who abuse chargebacks are our problem to block — a chargeback pattern
                  among your buyers is not, by itself, held against you.
                </li>
                <li>
                  <strong>Investigations are bounded.</strong> If we reasonably suspect fraud or a
                  serious breach involving specific sales, we may pause payout of the{" "}
                  <strong>affected amounts</strong> while we investigate — we will tell you in
                  writing what is paused and why, and resolve it within <strong>60 days</strong>. We
                  never pause your unrelated earnings, and sales we confirm as fraudulent simply do
                  not count as sales.
                </li>
                <li>
                  <strong>No forfeiture — ever.</strong> Ending this agreement (by either side, for
                  any reason) never forfeits earnings from genuine sales. If this agreement ends, we
                  pay your remaining balance (whatever its size) on the normal cycle, no later than
                  60 days after the end date.
                </li>
                <li>
                  Obvious payment errors (double counting, wrong amounts) may be corrected by either
                  side; we will always show our working.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Taxes and paperwork</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  <strong>VAT on student sales is our job.</strong> We collect it and pay it to the
                  tax office. You never touch it.
                </li>
                <li>
                  <strong>Self-billing.</strong> You agree that we issue the required invoices or
                  settlement statements for your share <strong>on your behalf</strong> (self-billing
                  / samofakturowanie). We send you each statement; if you do not object within 14
                  days, it is considered accepted. You will not issue separate invoices for the same
                  amounts. If you are VAT-registered, VAT on your share is added on top and shown on
                  the self-billed invoice.
                </li>
                <li>
                  <strong>Your income tax is yours.</strong> You are responsible for your own income
                  tax and social contributions in your country. We give you the records you need.
                </li>
                <li>
                  <strong>Tax information (DAC7).</strong> EU law requires platforms to report
                  instructor earnings to tax authorities. You will give us your legal name, address,
                  tax identification number, and VAT status (if any), keep them current, and we will
                  report as required. We cannot pay out without this information.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Fair play</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  Students who buy your content on Lean Sporty are our customers for billing
                  purposes. Do not redirect Lean Sporty checkout to outside payment for content
                  hosted here. (Teaching the same material elsewhere, on other platforms or in
                  person, is completely fine — see Section 1.)
                </li>
                <li>
                  Follow our published content and conduct rules. We may unpublish content or
                  suspend accounts for serious or repeated violations, as in the Terms of Service.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Ending this agreement</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  Either of us may end it with <strong>30 days&apos; written notice</strong> (email
                  is fine). We may end or suspend it immediately for a serious breach (for example,
                  rights infringement or fraud).
                </li>
                <li>
                  What survives the end: buyers keep access to what they bought (Section 3); the
                  library license for your class recordings continues (Section 3); your final
                  balance is paid (Section 6); and Sections 4, 10, and 11 continue to apply.
                </li>
                <li>
                  Your unpublished drafts and unsold uploads are deleted or returned on request
                  within a reasonable time.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                Both sides&apos; liability is limited as in the Terms of Service. Our total
                liability to you under this agreement is capped at the platform fees we retained
                from your sales in the 12 months before the claim. Nothing limits liability that
                cannot be limited by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. General</h2>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>
                  <strong>Data protection:</strong> we process your personal data as described in
                  the{" "}
                  <Link href="/privacy" className="text-pink-600 hover:text-pink-700">
                    Privacy Policy
                  </Link>
                  , and for the payout, tax, and reporting purposes above.
                </li>
                <li>
                  <strong>Changes:</strong> we may update this agreement with at least 30
                  days&apos; notice. Changes never retroactively alter the split on existing
                  products (Section 5). If you do not agree with a change, you may end the agreement
                  under Section 9 before it takes effect.
                </li>
                <li>
                  <strong>Governing law:</strong> Polish law; Polish courts. Language: English.
                </li>
                <li>
                  <strong>Entire agreement:</strong> this document plus the Terms of Service and the
                  policies they reference are the whole deal. If they conflict about instructor
                  matters, this document wins.
                </li>
              </ul>
            </section>

            <section>
              <p className="text-gray-600 text-sm leading-relaxed">
                Accepted electronically at instructor activation. We log your instructor account,
                the time of acceptance, and the agreement version shown above.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
