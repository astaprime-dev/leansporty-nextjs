import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta } from "@/components/guides/guide-blocks";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides — Honest Answers About Dance Fitness",
  description:
    "Plain-English guides to dance workouts at home: what they're worth, what they burn, how to start as a complete beginner, and how to come back after years off.",
  alternates: { canonical: "/guides" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: GUIDES.map((g, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: g.title,
    url: `https://leansporty.com/guides/${g.slug}`,
  })),
};

export default function GuidesIndex() {
  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-balance text-3xl font-light text-gray-900 sm:text-4xl">
          Guides
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-gray-600">
          Honest, plain-English answers to the questions people actually ask
          about dance fitness — real numbers, realistic timelines, no hype.
        </p>

        <ul className="mt-10 space-y-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="block rounded-2xl border border-pink-100 p-6 transition-colors hover:border-pink-300"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {g.title}
                </h2>
                <p className="mt-2 font-light leading-relaxed text-gray-600">
                  {g.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <GuideCta />
      </div>
    </div>
  );
}
