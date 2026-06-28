import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Music, Clock, TrendingUp, Home, Video, Users, Star, Calendar } from "lucide-react";

export default function Header() {
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
            Feel confident, strong, and energized — right from your living room.
          </p>
          <p className="text-lg lg:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-light">
            A follow-along dance program you can start in your browser today —
            short, fun, equipment-free sessions for women who want to enjoy moving
            again. Beginner-friendly, and Day 1 is free to try.
          </p>

          {/* Primary CTAs → the web offer */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="brand" size="pill">
              <Link href="/challenge">Start the 21-Day Challenge — €49</Link>
            </Button>
            <Button asChild variant="brandOutline" size="pill">
              <Link href="/challenge">Try Day 1 free</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-400 font-light">
            €49 once · 15 sessions + rest days · 1 year of access · free Day 1
          </p>
        </div>

        {/* Video Section — the hero media */}
        <div className="w-full max-w-5xl px-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-pink-100 shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/PWauX9QceBY?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=PWauX9QceBY&controls=1"
              title="Lean Sporty Dance Workout"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            ></iframe>
          </div>
        </div>

        {/* Secondary: iOS app (watch on the go — purchases happen on web) */}
        <div className="w-full flex flex-col items-center gap-2">
          <p className="text-sm text-gray-400 font-light tracking-wide">Prefer your phone? Also on iOS.</p>
          <a
            href="https://apps.apple.com/app/id6745218800"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block opacity-80 transition-all duration-300 hover:opacity-100 hover:scale-105"
          >
            <img
              src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
              alt="Download on the App Store"
              className="h-11"
            />
          </a>
        </div>


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

          {/* Primary CTA → the web offer */}
          <Link
            href="/challenge"
            className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-lg font-semibold text-pink-600 shadow-lg transition-all duration-300 hover:scale-105"
          >
            Start the 21-Day Challenge — €49
          </Link>

          <p className="text-base lg:text-lg mt-6 font-light opacity-90">
            €49 once · free Day 1 · 1 year of access
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
