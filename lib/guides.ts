export type GuideFaqItem = { q: string; a: string };

export type GuideMeta = {
  slug: string;
  title: string;
  blurb: string;
};

/**
 * Registry of all published guides — single source of truth for the /guides
 * index, the related-guides block, and the sitemap. Add new guides here.
 */
export const GUIDES: GuideMeta[] = [
  {
    slug: "dance-workout-women-over-30",
    title: "Is dancing a good workout for women over 30?",
    blurb:
      "What dance workouts actually do for your fitness in your 30s — honest numbers and realistic expectations.",
  },
  {
    slug: "beginner-dance-workout-at-home",
    title: "Dance workouts for complete beginners at home",
    blurb:
      "No equipment, no experience, no gym — what you need, what your first session feels like, and how to make it stick.",
  },
  {
    slug: "calories-burned-dance-workout",
    title: "How many calories does a dance workout burn?",
    blurb:
      "The honest math: real numbers by body weight and session length, and how dancing compares to walking and jogging.",
  },
  {
    slug: "low-impact-cardio-no-jumping",
    title: "Low-impact cardio without jumping",
    blurb:
      "Knee-friendly, apartment-quiet cardio that still gets your heart rate up — low-impact doesn't mean easy.",
  },
  {
    slug: "start-exercising-again-after-years",
    title: "How to start exercising again after years off",
    blurb:
      "Why restarting feels so hard, what to expect week by week, and the mistakes that end most comebacks.",
  },
];

/** Launch date of the guides section; override per page when adding new ones. */
const GUIDES_PUBLISHED = "2026-07-25";

/** Article + FAQPage + BreadcrumbList JSON-LD for a guide page. */
export function guideJsonLd(opts: {
  headline: string;
  description: string;
  slug: string;
  faq: GuideFaqItem[];
  datePublished?: string;
}) {
  const url = `https://leansporty.com/guides/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: opts.headline,
        description: opts.description,
        image: "https://leansporty.com/og-challenge.jpg",
        datePublished: opts.datePublished ?? GUIDES_PUBLISHED,
        dateModified: opts.datePublished ?? GUIDES_PUBLISHED,
        author: {
          "@type": "Person",
          name: "Anastasiia",
          jobTitle: "Choreographer and dance instructor",
          url: "https://leansporty.com",
        },
        publisher: {
          "@type": "Organization",
          name: "Lean Sporty",
          url: "https://leansporty.com",
        },
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        mainEntity: opts.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Guides",
            item: "https://leansporty.com/guides",
          },
          { "@type": "ListItem", position: 2, name: opts.headline, item: url },
        ],
      },
    ],
  };
}
