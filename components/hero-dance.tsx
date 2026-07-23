import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Music, Clock, TrendingUp, Home, Video, Users, Star, Calendar, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/challenge/cta";
import { PublicStreamEmbed } from "@/components/public-stream-embed";
import HomeVignettes from "@/components/home-vignettes";
import { CHALLENGE_SLUG, CHALLENGE_TRAILER_UID } from "@/lib/challenge";

export default function Header({
  isAuthenticated,
  owned,
  priceLabel,
  tryDayHref,
}: {
  isAuthenticated: boolean;
  owned: boolean;
  priceLabel: string;
  /** Deep link to Day 1 on the watch page (plays for everyone). */
  tryDayHref: string;
}) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Soft editorial background — one faint warm glow, no clutter */}
      <div className="absolute inset-0 w-full bg-gradient-to-b from-rose-50 via-white to-white pointer-events-none">
        <div className="absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-pink-200/25 blur-3xl"></div>
      </div>

      {/* Content Layer - Centered with max-width */}
      <div className="relative z-10 flex flex-col items-center py-16 gap-20">

        {/* Hero Section */}
        <div className="w-full max-w-4xl px-6 pt-8 text-center">
          <h1 className="font-display animate-fade-up text-5xl lg:text-7xl font-light mb-8 text-gray-900 tracking-tight leading-[1.05]">
            Dance Your Way to <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Fitness</span>
          </h1>
          <p className="animate-fade-up text-2xl lg:text-3xl text-gray-600 mb-6 font-light leading-relaxed" style={{ animationDelay: "0.08s" }}>
            On-demand dance workouts — at home, in a hotel room, wherever you are.
          </p>
          {/* Primary CTAs — act directly (checkout / Day 1); the /challenge
              landing stays one click away for people who want the full pitch. */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CheckoutButton
              productSlug={CHALLENGE_SLUG}
              isAuthenticated={isAuthenticated}
              owned={owned}
              next="/challenge?intent=checkout"
              label={`Start the 21-Day Challenge — ${priceLabel}`}
              className="h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-8 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
            />
            {!owned && (
              <Button asChild variant="brandOutline" size="pill">
                <Link href={tryDayHref}>Try Day 1 free</Link>
              </Button>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-400 font-light">
            {priceLabel} once · 15 sessions + rest days · 1 year of access · free Day 1
          </p>
          <p className="mt-2 text-sm">
            <Link
              href="/challenge"
              className="text-pink-500 hover:text-pink-600 transition-colors"
            >
              See what&apos;s inside the challenge →
            </Link>
          </p>
        </div>

        {/* Video Section — Day 1 itself, self-hosted (no YouTube exits) */}
        <div className="w-full max-w-5xl px-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-pink-100 shadow-lg">
            <PublicStreamEmbed
              uid={CHALLENGE_TRAILER_UID}
              title="Day 1 of the 21-Day Dance Challenge"
            />
          </div>
          <p className="mt-3 text-center text-sm text-gray-400 font-light">
            You&apos;re watching Day 1 — the real first session of the challenge.
          </p>
          <p className="mt-8 text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto text-center leading-relaxed font-light text-balance">
            A follow-along dance program for women who want to enjoy moving again.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              "Starts in your browser",
              "Short, fun sessions",
              "No equipment",
              "Beginner-friendly",
              "Day 1 free",
            ].map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="gap-1.5 border-pink-100 bg-white/80 px-4 py-1.5 text-sm font-normal text-gray-600"
              >
                <Check className="h-3.5 w-3.5 text-pink-500" strokeWidth={2.5} />
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* See-yourself vignettes — emotional identification before the feature pitch */}
        <HomeVignettes
          isAuthenticated={isAuthenticated}
          owned={owned}
          priceLabel={priceLabel}
          tryDayHref={tryDayHref}
        />

        {/* Why Lean Sporty Section */}
        <section className="w-full px-6 py-16">
          <div className="w-full max-w-4xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-light mb-6 text-gray-900 tracking-tight">
              Why <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Lean Sporty</span>?
            </h2>
            <p className="text-lg text-gray-500 font-light">Designed for your lifestyle, your goals, your journey.</p>
          </div>

          {/* Feature Cards Grid */}
          <div className="w-full max-w-7xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Sparkles, title: "Easy-to-Follow Dance Routines", desc: "Fun moves that anyone can do, regardless of experience level." },
              { icon: Zap, title: "Cardio + Strength in Every Session", desc: "Burn calories and build strength with every beat." },
              { icon: Music, title: "Uplifting Music & Motivation", desc: "Energizing playlists and a motivating instructor to keep you going." },
              { icon: Clock, title: "Quick Workouts", desc: "Fit fitness into any schedule with short, effective sessions." },
              { icon: TrendingUp, title: "Track Your Progress", desc: "Stay inspired by watching your fitness journey unfold." },
              { icon: Home, title: "Train From Home", desc: "Cardio, aerobics, and weight loss dance workouts — all from your living room." }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="relative group bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-12 h-12 text-pink-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="relative font-semibold text-xl mb-4 text-gray-900">{feature.title}</h3>
                  <p className="relative text-gray-500 leading-relaxed font-light">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Streaming Section */}
        <section className="w-full px-6 py-16">
          <div className="w-full max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl lg:text-5xl font-light mb-6 text-gray-900 tracking-tight">
                Join <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Live Classes</span>
              </h2>
              <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
                Connect with expert instructors in real-time for an interactive, community-driven fitness experience.
              </p>
            </div>

            {/* Live Streaming Features */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Feature 1 */}
              <div className="relative group bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                <div className="relative mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <Video className="w-12 h-12 text-pink-500" strokeWidth={1.5} />
                </div>
                <h3 className="relative font-semibold text-xl mb-4 text-gray-900">Real-Time Interaction</h3>
                <p className="relative text-gray-600 leading-relaxed font-light">
                  Stream live dance workouts with certified instructors. Get real-time feedback, motivation, and guidance as you move.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative group bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                <div className="relative mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-12 h-12 text-pink-500" strokeWidth={1.5} />
                </div>
                <h3 className="relative font-semibold text-xl mb-4 text-gray-900">Community Energy</h3>
                <p className="relative text-gray-600 leading-relaxed font-light">
                  Work out alongside others in a supportive, energizing environment. Share the journey and stay motivated together.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative group bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                <div className="relative mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-12 h-12 text-pink-500" strokeWidth={1.5} />
                </div>
                <h3 className="relative font-semibold text-xl mb-4 text-gray-900">Expert Instructors</h3>
                <p className="relative text-gray-600 leading-relaxed font-light">
                  Learn from passionate, certified dance fitness instructors who bring expertise, creativity, and positive vibes to every session.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="relative group bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                <div className="relative mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-12 h-12 text-pink-500" strokeWidth={1.5} />
                </div>
                <h3 className="relative font-semibold text-xl mb-4 text-gray-900">Scheduled Sessions</h3>
                <p className="relative text-gray-600 leading-relaxed font-light">
                  Browse upcoming live classes, book your spot, and join from anywhere. Flexible scheduling to fit your lifestyle.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button asChild variant="brand" className="gap-3 px-8 h-14 text-lg">
                <Link href="/streams">
                  <span>Browse Live Streams</span>
                  <span className="text-xl">→</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>


      </div>

      {/* CTA Section - Full Width Pink Background */}
      <div className="relative w-full bg-gradient-to-br from-pink-500 via-rose-400 to-pink-400 py-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-t from-rose-600/20 to-transparent"></div>

        {/* Centered Content */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="font-display text-4xl lg:text-5xl font-light mb-6 leading-tight drop-shadow-lg">
            Join a Community of Women<br/>
            <span className="font-medium">Moving with Joy</span>
          </h2>
          <p className="text-xl lg:text-2xl mb-10 font-light opacity-95 leading-relaxed">
            No stress. Just sweat, rhythm, and results.
          </p>

          {/* Primary CTA — acts directly, same as the hero */}
          <div className="flex justify-center">
            <CheckoutButton
              productSlug={CHALLENGE_SLUG}
              isAuthenticated={isAuthenticated}
              owned={owned}
              next="/challenge?intent=checkout"
              label={`Start the 21-Day Challenge — ${priceLabel}`}
              className="h-14 rounded-full bg-white px-10 text-lg font-semibold text-pink-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white"
            />
          </div>

          <p className="text-base lg:text-lg mt-6 font-light opacity-90">
            {priceLabel} once · free Day 1 · 1 year of access
          </p>

          {/* Secondary: iOS */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm font-light opacity-80">Or watch on iOS</p>
            <a
              href="https://apps.apple.com/app/id6745218800"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block opacity-90 transition-all duration-300 hover:scale-105"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83"
                alt="Download on the App Store"
                className="h-11 drop-shadow-lg"
              />
            </a>
          </div>

          {/* Decorative bottom */}
          <div className="flex justify-center mt-8">
            <div className="w-24 h-px bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-16 bg-gradient-to-b from-pink-50/20 to-transparent"></div>
    </div>
  );
}
