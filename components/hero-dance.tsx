import LeanSportyLogo from "./lean-sporty-logo";

export default function Header() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Full-Width Background Layer - Spans entire viewport */}
      <div className="absolute inset-0 w-full bg-gradient-to-b from-pink-50/30 via-white to-pink-50/20 pointer-events-none">
        {/* Floating Blobs - Full width */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-gradient-to-br from-rose-200/15 to-pink-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-300/20 to-rose-100/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Dot Pattern - Full width */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, #ffc0cb 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Decorative Sparkles */}
        <div className="absolute top-32 left-1/4 text-pink-300/40 text-2xl">✦</div>
        <div className="absolute top-96 right-1/3 text-rose-300/40 text-xl">✦</div>
        <div className="absolute bottom-1/3 left-1/3 text-pink-400/30 text-3xl">✦</div>
        <div className="absolute top-1/2 right-1/4 text-rose-200/50 text-lg">✧</div>
        <div className="absolute bottom-40 left-1/4 text-pink-300/40 text-2xl">✧</div>
      </div>

      {/* Content Layer - Centered with max-width */}
      <div className="relative z-10 flex flex-col items-center py-16 gap-20">

        {/* Logo Section */}
        <div className="w-full flex justify-center pt-8">
          <LeanSportyLogo />
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-4xl px-6 text-center">
          {/* Decorative ornament */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 text-pink-300/60">
              <span className="text-xl">✦</span>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
              <span className="text-2xl">✧</span>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
              <span className="text-xl">✦</span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-light mb-8 text-gray-800 tracking-tight leading-tight">
            Dance Your Way to <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 drop-shadow-sm">Fitness</span>
          </h1>
          <p className="text-2xl lg:text-3xl text-gray-600 mb-6 font-light leading-relaxed">
            Feel confident, strong, and energized — right from your living room.
          </p>
          <p className="text-lg lg:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-light">
            Lean Sporty is the ultimate dance-inspired fitness app designed for women who want to enjoy working out.
            Whether you're a beginner or getting back into shape, our short and fun dance workouts help you burn calories,
            tone your body, and boost your mood — without needing any equipment.
          </p>
        </div>

        {/* YouTube Video Section */}
        <div className="w-full max-w-6xl px-6">
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 blur-2xl"></div>
            <iframe
              src="https://www.youtube.com/embed/PWauX9QceBY??rel=0&modestbranding=1&autoplay=1&mute=1&controls=1"
              title="Lean Sporty Dance Workout"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="relative w-full h-full border-0 rounded-3xl"
            ></iframe>
          </div>
        </div>

        {/* App Store Download */}
        <div className="w-full flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-pink-400/20 blur-xl rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <a
              href="https://apps.apple.com/app/id6745218800"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block transform hover:scale-105 transition-all duration-300"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                alt="Download on the App Store"
                className="h-16"
              />
            </a>
          </div>
          <p className="text-sm text-gray-400 font-light tracking-wide">Available now on iOS</p>
        </div>

        {/* Elegant Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300 rounded-full"></div>

        {/* Why Lean Sporty Section */}
        <section className="w-full px-6 py-16">
          <div className="w-full max-w-4xl mx-auto text-center mb-16">
            <div className="flex justify-center mb-6">
              <span className="text-3xl text-pink-300/50">✧</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light mb-6 text-gray-800 tracking-tight">
              Why <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Lean Sporty</span>?
            </h2>
            <p className="text-lg text-gray-500 font-light">Designed for your lifestyle, your goals, your journey.</p>
            <div className="flex justify-center mt-8">
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="w-full max-w-7xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[
              { emoji: "💃", title: "Easy-to-Follow Dance Routines", desc: "Fun moves that anyone can do, regardless of experience level." },
              { emoji: "🔥", title: "Cardio + Strength in Every Session", desc: "Burn calories and build strength with every beat." },
              { emoji: "🎵", title: "Uplifting Music & Motivation", desc: "Energizing playlists and a motivating instructor to keep you going." },
              { emoji: "⏱️", title: "Quick Workouts", desc: "Fit fitness into any schedule with short, effective sessions." },
              { emoji: "📊", title: "Track Your Progress", desc: "Stay inspired by watching your fitness journey unfold." },
              { emoji: "🏠", title: "Train From Home", desc: "Cardio, aerobics, and weight loss dance workouts — all from your living room." }
            ].map((feature, idx) => (
              <div key={idx} className="relative group bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-pink-100 hover:border-pink-300 shadow-lg hover:shadow-pink-200/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -top-2 -right-2 text-pink-200/30 text-4xl">✦</div>
                <div className="relative text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{feature.emoji}</div>
                <h3 className="relative font-semibold text-xl mb-4 text-gray-800">{feature.title}</h3>
                <p className="relative text-gray-500 leading-relaxed font-light">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* CTA Section - Full Width Pink Background */}
      <div className="relative w-full bg-gradient-to-br from-pink-500 via-rose-400 to-pink-400 py-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 text-white/10 text-6xl">✦</div>
        <div className="absolute bottom-10 right-10 text-white/10 text-6xl">✦</div>
        <div className="absolute top-1/2 left-20 text-white/5 text-8xl">✧</div>
        <div className="absolute top-1/3 right-20 text-white/5 text-7xl">✧</div>
        <div className="absolute inset-0 bg-gradient-to-t from-rose-600/20 to-transparent"></div>

        {/* Centered Content */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 text-center text-white">
          {/* Decorative top ornament */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3 text-white/60">
              <span className="text-2xl">✦</span>
              <div className="w-16 h-px bg-white/40"></div>
              <span className="text-3xl">✧</span>
              <div className="w-16 h-px bg-white/40"></div>
              <span className="text-2xl">✦</span>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-light mb-6 leading-tight drop-shadow-lg">
            Join a Community of Women<br/>
            <span className="font-semibold">Moving with Joy</span>
          </h2>
          <p className="text-xl lg:text-2xl mb-10 font-light opacity-95 leading-relaxed">
            No stress. Just sweat, rhythm, and results.
          </p>

          {/* App Store Button */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-xl transform scale-110"></div>
            <a
              href="https://apps.apple.com/app/id6745218800"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block transform hover:scale-105 transition-all duration-300"
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83"
                alt="Download on the App Store"
                className="h-16 drop-shadow-lg"
              />
            </a>
          </div>

          <p className="text-lg lg:text-xl mt-8 font-light opacity-90">
            Start your journey today with Lean Sporty — fitness made fun.
          </p>

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
