import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import HeaderNav from "@/components/header-nav";
import MobileMenuWrapper from "@/components/mobile-menu-wrapper";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { createClient } from "@/utils/supabase/server";
import { Geist, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Lean Sporty",
  description: "New way to get fit and energized through dance",
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "Lean Sporty",
    description: "New way to get fit and energized through dance",
    images: [
      {
        url: '/logo1024.png',
        width: 1024,
        height: 1024,
        alt: 'Lean Sporty Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Lean Sporty",
    description: "New way to get fit and energized through dance",
    images: ['/logo1024.png'],
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

// Elegant editorial display face for headlines.
const playfair = Playfair_Display({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-display",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${geistSans.className} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <div className="flex-1 w-full flex flex-col">
              {/* Elegant Header */}
              <nav className="relative w-full bg-white/80 backdrop-blur-md border-b border-pink-100/50 shadow-sm z-50">
                <div className="w-full max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
                  {/* Logo/Brand */}
                  <Link href={"/"} className="group flex items-center gap-2 md:gap-3">
                    <span className="font-display text-2xl md:text-3xl font-normal tracking-tight text-gray-900 group-hover:text-pink-500 transition-colors duration-300">
                      Lean <span className="font-medium bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Sporty</span>
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-pink-300/60 text-xs">
                      <span>✦</span>
                    </div>
                  </Link>

                  {/* Navigation Links */}
                  <div className="flex items-center gap-2 md:gap-4 lg:gap-8">
                    {/* Authenticated user navigation */}
                    <HeaderNav />

                    {/* Auth Buttons */}
                    <HeaderAuth />

                    {/* Primary CTA - Desktop only.
                        Anonymous → drive to the web offer (the commerce surface).
                        Signed in → Download App (iOS = watch/retention surface). */}
                    {user ? (
                      <a
                        href="https://apps.apple.com/app/id6745218800"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs lg:text-sm font-light rounded-full hover:shadow-lg hover:shadow-pink-200/50 transform hover:scale-105 transition-all duration-300"
                      >
                        <span>Download App</span>
                        <span className="text-xs">✧</span>
                      </a>
                    ) : (
                      <Link
                        href="/challenge"
                        className="hidden sm:inline-flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs lg:text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-pink-200/50 transform hover:scale-105 transition-all duration-300"
                      >
                        <span>Start the Challenge</span>
                        <span className="text-xs">✧</span>
                      </Link>
                    )}

                    {/* Mobile Menu */}
                    <MobileMenuWrapper />
                  </div>
                </div>
              </nav>

              {/* Page Content */}
              <div className="w-full flex-1">
                {children}
              </div>

              {/* Elegant Footer */}
              <footer className="relative w-full bg-gradient-to-b from-white to-pink-50/30 border-t border-pink-100/50 py-12 md:py-16">
                <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
                  <div className="flex flex-col items-center gap-6">
                    {/* Brand + tagline */}
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xl md:text-2xl font-normal text-gray-800">
                        Lean <span className="font-medium bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Sporty</span>
                      </span>
                      <span className="text-pink-300/50 text-sm">✦</span>
                    </div>
                    <p className="max-w-md text-center text-sm text-gray-500 font-light">
                      Dance-inspired fitness for women who want to enjoy moving — start in your browser, watch anywhere.
                    </p>

                    {/* Anonymous CTA → the web offer */}
                    {!user && (
                      <Link
                        href="/challenge"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-pink-200/50"
                      >
                        <span>Start the 21-Day Challenge</span>
                        <span className="text-xs">✧</span>
                      </Link>
                    )}

                    {/* Footer nav */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-light text-gray-600">
                      <Link href="/challenge" className="hover:text-pink-500 transition-colors">Challenge</Link>
                      <Link href="/streams" className="hover:text-pink-500 transition-colors">Streams</Link>
                      {user && (
                        <Link href="/my-program" className="hover:text-pink-500 transition-colors">My Program</Link>
                      )}
                      {user && (
                        <Link href="/instructor/activate" className="hover:text-pink-500 transition-colors">Become an instructor</Link>
                      )}
                    </div>

                    {/* Decorative Divider */}
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>

                    {/* Legal + operator (EU imprint) */}
                    <div className="flex flex-col items-center gap-1.5 text-center text-xs text-gray-400 font-light">
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                        <Link href="/privacy" className="hover:text-pink-500 transition-colors">Privacy Policy</Link>
                        <span>·</span>
                        <Link href="/terms" className="hover:text-pink-500 transition-colors">Terms of Service</Link>
                      </div>
                      <p>Operated by Astaprime Sp. z o.o., Poland</p>
                      <p>&copy; {new Date().getFullYear()} Lean Sporty. All rights reserved.</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                  <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-200/20 to-transparent rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full blur-3xl"></div>
                </div>
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
