import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { CHALLENGE_TRAILER_UID } from "@/lib/challenge";

/**
 * PLACEHOLDER DATA — swap for the real instructor before promoting this
 * section: set `name`, replace `photo` with a real portrait (drop a file in
 * public/ and use its path), and rewrite `bio`/`facts` with her real story.
 * The photo currently falls back to a frame of the actual instructor from
 * the Day 1 video (honest, but a proper portrait will look better).
 */
const INSTRUCTOR: {
  name: string | null;
  photo: string | null;
  bio: string[];
  facts: string[];
} = {
  name: "Anastasiia", // Ukrainian transliteration — matches her Instagram
  photo: "/instructor-photo.jpg",
  bio: [
    "Dancing since childhood, Anastasiia is a choreographer with her own dance project — she performs on stage and organizes concerts with her own group.",
    "And here is the part that matters for you: that group is everyday women, just like you. She has taught them for years — her choreography ranges from feminine styles to sporty, sneakers-on routines.",
    "In the 21-Day Challenge she leads every session herself. Simple steps, big energy, zero judgement.",
  ],
  facts: [
    "Dancing since childhood",
    "Choreographer with her own stage project",
    "Years of teaching everyday women",
  ],
};

function fallbackPhoto(): string | null {
  const code = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!code) return null;
  return `https://customer-${code}.cloudflarestream.com/${CHALLENGE_TRAILER_UID}/thumbnails/thumbnail.jpg?time=15s&height=1000`;
}

export default function HomeInstructor({
  photo: photoOverride,
  aspectClass = "aspect-[1405/1600]",
}: {
  /** Override the photo (e.g. the portrait crop on /challenge). */
  photo?: string;
  /** Tailwind aspect class matching the photo's exact ratio. */
  aspectClass?: string;
} = {}) {
  const photo = photoOverride ?? INSTRUCTOR.photo ?? fallbackPhoto();

  return (
    <section className="w-full px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 md:grid-cols-[2fr_3fr] md:gap-14">
        <div className={`relative ${aspectClass} overflow-hidden rounded-2xl border border-pink-100 shadow-lg`}>
          {photo && (
            <Image
              src={photo}
              alt="Anastasiia, your Lean Sporty instructor"
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="text-center md:text-left">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-pink-500">
            Meet your instructor
          </p>
          <h2 className="font-display mb-6 text-4xl font-light tracking-tight text-gray-900 lg:text-5xl">
            {INSTRUCTOR.name ?? "Your instructor"}
          </h2>
          {INSTRUCTOR.bio.map((line) => (
            <p
              key={line}
              className="mb-4 text-lg font-light leading-relaxed text-gray-600"
            >
              {line}
            </p>
          ))}
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
            {INSTRUCTOR.facts.map((fact) => (
              <Badge
                key={fact}
                variant="outline"
                className="gap-1.5 border-pink-100 bg-white/80 px-4 py-1.5 text-sm font-normal text-gray-600"
              >
                <Check className="h-3.5 w-3.5 text-pink-500" strokeWidth={2.5} />
                {fact}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
