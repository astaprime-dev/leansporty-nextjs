import Image from "next/image";

/**
 * Intensity proof strip — a product fact (calorie burn), deliberately styled
 * apart from the persona vignettes: tinted full-width band, stat-first
 * headline. Sits between the vignette payoff and the feature grid.
 */
export default function HomeIntensity() {
  return (
    <section className="w-full bg-pink-50/50 py-12">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-6 md:grid-cols-[2fr_3fr] md:gap-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-pink-100 shadow-sm">
          <Image
            src="/home-vignette-watch.jpg"
            alt="A smartwatch on a woman's wrist showing workout activity and heart rate"
            fill
            sizes="(min-width: 768px) 24rem, 100vw"
            className="object-cover"
          />
        </div>
        <div className="text-center md:text-left">
          <h2 className="font-display text-4xl font-light tracking-tight text-gray-900 lg:text-5xl">
            Up to{" "}
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
              200 calories
            </span>{" "}
            in 15 minutes.
          </h2>
          <p className="mt-4 text-lg font-light leading-relaxed text-gray-600">
            Short doesn&apos;t mean easy. These sessions are really intense —
            check your watch when you&apos;re done.
          </p>
        </div>
      </div>
    </section>
  );
}
