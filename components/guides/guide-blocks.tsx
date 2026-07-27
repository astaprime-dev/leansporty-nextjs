import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUIDES, type GuideFaqItem } from "@/lib/guides";

/** Pink uppercase eyebrow above the h1 — links back to the guides index. */
export function GuideEyebrow() {
  return (
    <Link
      href="/guides"
      className="text-sm font-semibold uppercase tracking-wide text-pink-600 transition-colors hover:text-pink-500"
    >
      Guides
    </Link>
  );
}

/** Mid-article editorial photo with caption. */
export function GuideFigure(props: {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="mx-auto max-w-md">
      <Image
        src={props.src}
        alt={props.alt}
        width={props.width ?? 1066}
        height={props.height ?? 1600}
        className="rounded-2xl border border-pink-100"
      />
      <figcaption className="mt-3 text-center text-sm font-light text-gray-500">
        {props.caption}
      </figcaption>
    </figure>
  );
}

/**
 * The one CTA per guide: free Day 1 of the challenge. Same composition as the
 * /challenge pricing block — card inside the photo, instructor beside it. On
 * mobile the photo would shrink to slivers, so it degrades to a soft gradient
 * (same trick as the challenge page).
 */
export function GuideCta() {
  return (
    <section className="relative left-1/2 mt-14 w-screen -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50/60 to-rose-50/60 md:hidden" />
      <Image
        src="/guide-cta-anastasiia-2880.jpg"
        alt=""
        fill
        sizes="100vw"
        className="hidden object-cover object-[70%_center] md:block"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="max-w-md rounded-2xl border-2 border-pink-200 bg-white/95 p-8 text-center shadow-lg backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
            <Sparkles className="h-3.5 w-3.5" /> First session free
          </span>
          <h2 className="font-display mt-4 text-balance text-3xl font-light text-gray-900">
            Check out the 21&#8209;Day Dance Challenge
          </h2>
          <p className="mt-3 font-light text-gray-600">
            Short, beginner-friendly dance workouts you follow along at home,
            led by choreographer Anastasiia. The first session is free to
            watch — no sign-up, just press play and see how it feels.
          </p>
          <Button asChild variant="brand" size="pill" className="mt-6">
            <Link href="/challenge">See the Challenge</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * The CTA for instructor-facing guides: teach on Lean Sporty. Same card
 * treatment as GuideCta, gradient background on all breakpoints.
 */
export function GuideTeachCta() {
  return (
    <section className="relative left-1/2 mt-14 w-screen -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-50/60 to-rose-50/60" />
      <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="max-w-md rounded-2xl border-2 border-pink-200 bg-white/95 p-8 text-center shadow-lg backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
            <Sparkles className="h-3.5 w-3.5" /> For instructors
          </span>
          <h2 className="font-display mt-4 text-balance text-3xl font-light text-gray-900">
            Teach on Lean&nbsp;Sporty
          </h2>
          <p className="mt-3 font-light text-gray-600">
            Keep 80% of every sale after VAT (featured instructors 85%), paid
            to your bank once a month. You teach and keep your audience — we
            handle checkout, VAT, streaming, and hosting. Free to join.
          </p>
          <Button asChild variant="brand" size="pill" className="mt-6">
            <Link href="/teach">See how teaching works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** On-page FAQ — keep in sync with the FAQPage JSON-LD (guideJsonLd). */
export function GuideFaq({ faq }: { faq: GuideFaqItem[] }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-balance text-3xl font-light text-gray-900">
        Common questions
      </h2>
      <dl className="mt-6 space-y-8">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="text-lg font-semibold text-gray-900">{f.q}</dt>
            <dd className="mt-2 font-light leading-relaxed text-gray-600">
              {f.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Internal links to the other guides — crawlable cross-linking, same audience. */
export function GuideRelated({ currentSlug }: { currentSlug: string }) {
  const category =
    GUIDES.find((g) => g.slug === currentSlug)?.category ?? "move";
  const others = GUIDES.filter(
    (g) => g.slug !== currentSlug && (g.category ?? "move") === category
  );
  return (
    <nav aria-label="More guides" className="mt-14 border-t border-pink-100 pt-8">
      <h2 className="text-2xl font-semibold text-gray-900">More guides</h2>
      <ul className="mt-4 space-y-3">
        {others.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="font-light text-gray-600 underline decoration-pink-200 underline-offset-4 transition-colors hover:text-pink-600"
            >
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
