import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/challenge/cta";
import { CHALLENGE_SLUG } from "@/lib/challenge";

const VIGNETTES = [
  {
    image: "/home-vignette-mum.jpg",
    alt: "A mum exercising in her living room while her young son plays with blocks",
    headline: "No gym. No babysitter.",
    message:
      "Your living room is enough. A quick dance session while your little one plays — and you feel like you again.",
  },
  {
    image: "/home-vignette-work.jpg",
    alt: "A businesswoman at her desk, deep in a busy workday",
    headline: "Meetings all day. Zero time for a studio.",
    message:
      "You don't need one. Come home, press play, dance it off. Done before dinner.",
  },
  {
    image: "/home-vignette-travel.jpg",
    alt: "A woman with her suitcase in a hotel room high above the city",
    headline: "Traveling again?",
    message:
      "Your workout packs itself — it lives in your browser. A hotel room and 15 minutes are enough.",
  },
];

export default function HomeVignettes({
  isAuthenticated,
  owned,
  priceLabel,
  tryDayHref,
}: {
  isAuthenticated: boolean;
  owned: boolean;
  priceLabel: string;
  tryDayHref: string;
}) {
  return (
    <section className="w-full px-6 py-10">
      <div className="w-full max-w-4xl mx-auto text-center mb-16">
        <h2 className="font-display text-4xl lg:text-5xl font-light mb-6 text-gray-900 tracking-tight">
          Sound like <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">you</span>?
        </h2>
      </div>

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 lg:gap-16">
        {VIGNETTES.map((v, idx) => (
          <div
            key={v.image}
            className="grid items-center gap-8 md:grid-cols-2 md:gap-12"
          >
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border border-pink-100 shadow-lg ${idx % 2 === 1 ? "md:order-2" : ""}`}
            >
              <Image
                src={v.image}
                alt={v.alt}
                fill
                sizes="(min-width: 768px) 40rem, 100vw"
                className="object-cover"
              />
            </div>
            <div className={`text-center md:text-left ${idx % 2 === 1 ? "md:order-1" : ""}`}>
              <h3 className="font-display text-3xl lg:text-4xl font-light mb-4 text-gray-900 tracking-tight leading-snug">
                {v.headline}
              </h3>
              <p className="text-lg lg:text-xl text-gray-500 leading-relaxed font-light">
                {v.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* The payoff after the pain points */}
      <p className="mt-12 lg:mt-16 text-center text-2xl lg:text-3xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
        Feel <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">confident, strong, and energized</span> — right from your living room.
      </p>

      {/* Catch the moment: the same direct CTAs as the hero */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <CheckoutButton
          productSlug={CHALLENGE_SLUG}
          isAuthenticated={isAuthenticated}
          owned={owned}
          next="/challenge?intent=checkout"
          label={`Start the 21-Day Challenge — ${priceLabel}`}
          className="h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-8 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
          source="homepage-vignettes"
        />
        {!owned && (
          <Button asChild variant="brandOutline" size="pill">
            <Link href={tryDayHref}>Try Day 1 free</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
