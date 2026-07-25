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

/** The one CTA per guide: free Day 1 of the challenge. */
export function GuideCta() {
  return (
    <section className="mt-14 rounded-2xl border border-pink-100 bg-pink-50/50 p-8 text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
        <Sparkles className="h-3.5 w-3.5" /> Try it before you decide
      </span>
      <h2 className="font-display mt-4 text-balance text-3xl font-light text-gray-900">
        Feel it for yourself — Day 1 is free
      </h2>
      <p className="mx-auto mt-3 max-w-xl font-light text-gray-600">
        The first session of our 21-Day Dance Challenge is free to watch — a
        full, real workout led by a professional choreographer. No sign-up
        tricks: press play and see if it&apos;s for you.
      </p>
      <Button asChild variant="brand" size="pill" className="mt-6">
        <Link href="/challenge">Watch Day 1 free</Link>
      </Button>
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

/** Internal links to the other guides — crawlable cross-linking. */
export function GuideRelated({ currentSlug }: { currentSlug: string }) {
  const others = GUIDES.filter((g) => g.slug !== currentSlug);
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
