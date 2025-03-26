import LeanSportyLogo from "./lean-sporty-logo";

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
      <LeanSportyLogo />
      </div>
      {/* <h1 className="sr-only">Supabase and Next.js Starter Template</h1> */}
      <p className="text-3l lg:text-2xl !leading-tight mx-auto max-w-2xl text-center">
      A new way to get fit and energized through dance is coming soon. We're almost ready – be the first to try it!{" "}

      </p>
      <form action="https://formspree.io/f/maneookv" method="POST" className="space-y-4">
          <input 
            type="email" 
            name="email" 
            placeholder="Enter your email" 
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Notify Me
          </button>
        </form>

        <p className="text-sm text-gray-400">No spam. Just a one-time invite when we launch.</p>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />

      <section
      className="bg-cover bg-center bg-no-repeat h-screen w-full items-center justify-center py-12 px-6 pt-48"
      style={{ backgroundImage: "url('pexels-rdne-8929826.jpg')" }} /
    >

      {/* <!-- 🌟 Benefits Section --> */}
    <section className="bg-yellow-300 py-12 px-6">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">Why LeanSporty?</h2>
        <p className="text-gray-600">We’re combining fun and fitness to make movement something you’ll look forward to.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {/* <!-- Benefit 1 --> */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-blue-600 text-4xl mb-4">💃</div>
          <h3 className="font-semibold text-xl mb-2">Fun Dance-Based Workouts</h3>
          <p className="text-gray-600">No boring routines — just energetic moves designed to burn calories and boost your mood.</p>
        </div>
        {/* <!-- Benefit 2 --> */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-blue-600 text-4xl mb-4">📱</div>
          <h3 className="font-semibold text-xl mb-2">Mobile-First Experience</h3>
          <p className="text-gray-600">Access workouts anytime, anywhere — designed specifically for your phone.</p>
        </div>
        {/* <!-- Benefit 3 --> */}
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <div className="text-blue-600 text-4xl mb-4">💪</div>
          <h3 className="font-semibold text-xl mb-2">Progress That Motivates</h3>
          <p className="text-gray-600">Track your growth and feel your confidence rise with every beat and step.</p>
        </div>
      </div>
    </section>
    </div>
  );
}
