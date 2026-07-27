export type GuideFaqItem = { q: string; a: string };

export type GuideMeta = {
  slug: string;
  title: string;
  blurb: string;
  /** Audience: "move" = people who work out (default), "teach" = instructors. */
  category?: "move" | "teach";
};

/**
 * Registry of all published guides — single source of truth for the /guides
 * index, the related-guides block, and the sitemap. Add new guides here.
 */
export const GUIDES: GuideMeta[] = [
  {
    slug: "21-day-dance-challenge-results",
    title: "What actually happens in a 21-day dance challenge",
    blurb:
      "The honest week-by-week timeline — what three weeks of short dance workouts changes, what it doesn't, and what habit science really says.",
  },
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
  {
    slug: "dance-workout-no-rhythm",
    title: "Dance workouts for people who “can’t dance”",
    blurb:
      "Rhythm is a skill, not a birthright — what “no rhythm” really means, and how timing and coordination are trained at any age.",
  },
  {
    slug: "zumba-vs-dance-fitness",
    title: "Zumba vs dance fitness: what’s the difference?",
    blurb:
      "A fair comparison of the formats — and what to try if a Zumba class once felt too fast to follow.",
  },
  {
    slug: "embarrassed-to-dance",
    title: "Too embarrassed to dance — even alone at home?",
    blurb:
      "Feeling watched with nobody there is documented psychology, not a flaw — and format changes dissolve it, not pep talks.",
  },
  {
    slug: "how-often-dance-workout",
    title: "How often should you do dance workouts?",
    blurb:
      "The definitive frequency answer: a goal-by-goal table, the recovery logic behind it, and the truth about dancing daily.",
  },
  {
    slug: "apartment-dance-workout",
    title: "Apartment dance workouts: quiet and small-space",
    blurb:
      "What your downstairs neighbor actually hears, the swaps that keep choreography quiet, and how much room you really need.",
  },
  {
    slug: "dance-challenge-women-over-40",
    title: "A dance challenge for women over 40 (and 50)",
    blurb:
      "What changes about training in this decade, why structure beats willpower for returners, and what dance honestly doesn't replace.",
  },
  {
    slug: "do-youtube-dance-challenges-work",
    title: "Do free YouTube dance challenges actually work?",
    blurb:
      "A fair answer: what free playlists genuinely offer, why finishing is the hard part, and when structure is worth paying for.",
  },
  {
    slug: "instructor-extra-income",
    title: "How dance and fitness instructors earn extra income online",
    blurb:
      "The four realistic options compared honestly — extra studio hours, YouTube, 1:1 coaching, and selling your own classes online — with real numbers.",
    category: "teach",
  },
  {
    slug: "teaching-dance-online-income",
    title: "How much can you earn teaching dance online?",
    blurb:
      "The honest math: what a €15 class seat actually pays you, how many students €500/month takes, and how platform cuts compare.",
    category: "teach",
  },
  {
    slug: "sell-online-dance-classes",
    title: "How to sell online dance classes: a practical guide",
    blurb:
      "What you need (less than you think), live vs recorded, what to charge, and who handles payments, VAT, and invoices.",
    category: "teach",
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
