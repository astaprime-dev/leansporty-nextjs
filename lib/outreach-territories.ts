/**
 * Seed a new outreach city from just (city, country) — the founder types
 * "Brno, CZ" and gets localized hashtags and search queries without anyone
 * hand-writing them. Deterministic: a small country→language map below, with
 * an English fallback. Tune the words freely; nothing else needs to change.
 */

type Terms = {
  /** Local words for "instructor / trainer" — the Google-operator queries. */
  instructor: string[];
  /** Local activity words — combined with the city into hashtag guesses. */
  tags: string[];
};

const TERMS: Record<string, Terms> = {
  CZ: { instructor: ["instruktorka", "lektorka", "trenerka"], tags: ["zumba", "tanec", "pilates", "cviceni"] },
  SK: { instructor: ["instruktorka", "lektorka", "trenerka"], tags: ["zumba", "tanec", "pilates"] },
  PL: { instructor: ["instruktorka", "trenerka", "zajecia"], tags: ["zumba", "taniec", "trening", "pilates"] },
  UA: { instructor: ["тренерка", "викладачка", "інструкторка"], tags: ["zumba", "dance", "fitness"] },
  DE: { instructor: ["Tanzlehrerin", "Trainerin"], tags: ["zumba", "tanzen", "fitness"] },
  AT: { instructor: ["Tanzlehrerin", "Trainerin"], tags: ["zumba", "tanzen", "fitness"] },
  ES: { instructor: ["instructora", "profesora", "entrenadora"], tags: ["zumba", "baile", "fitness"] },
  MX: { instructor: ["instructora", "profesora"], tags: ["zumba", "baile", "fitness"] },
  AR: { instructor: ["instructora", "profesora"], tags: ["zumba", "baile", "fitness"] },
  CO: { instructor: ["instructora", "profesora"], tags: ["zumba", "baile", "fitness"] },
  IT: { instructor: ["istruttrice", "insegnante"], tags: ["zumba", "ballo", "fitness"] },
  PT: { instructor: ["instrutora", "professora"], tags: ["zumba", "danca", "fitness"] },
  BR: { instructor: ["instrutora", "professora"], tags: ["zumba", "danca", "fitness"] },
  FR: { instructor: ["professeure", "coach"], tags: ["zumba", "danse", "fitness"] },
};

const DEFAULT_TERMS: Terms = {
  instructor: ["instructor", "teacher", "coach"],
  tags: ["dance", "fitness", "zumba"],
};

/** "Kraków" → "krakow": hashtags and tag URLs want ASCII. */
function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function seedTerritory(city: string, country: string) {
  const terms = TERMS[country] ?? DEFAULT_TERMS;
  const citySlug = slug(city);

  return {
    city,
    country,
    hashtags: terms.tags.map((t) => `#${slug(t)}${citySlug}`),
    search_queries: [
      `site:instagram.com "${city}" (${terms.instructor.join(" OR ")})`,
      `site:instagram.com "${city}" (${terms.tags.join(" OR ")})`,
    ],
    places_queries: [
      `dance fitness classes in ${city}`,
      `zumba class in ${city}`,
      `pilates studio in ${city}`,
      `fitness classes for women in ${city}`,
    ],
  };
}
