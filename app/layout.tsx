import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import HeaderNav from "@/components/header-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
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
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
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
                <div className="w-full max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                  {/* Logo/Brand */}
                  <Link href={"/"} className="group flex items-center gap-3">
                    <span className="text-2xl font-light tracking-tight text-gray-800 group-hover:text-pink-500 transition-colors duration-300">
                      Lean<span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Sporty</span>
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-pink-300/60 text-xs">
                      <span>✦</span>
                    </div>
                  </Link>

                  {/* Navigation Links */}
                  <div className="flex items-center gap-8">
                    {/* Authenticated user navigation */}
                    <HeaderNav />

                    {/* Auth Buttons */}
                    <HeaderAuth />

                    {/* CTA Button */}
                    <a
                      href="https://apps.apple.com/app/id6745218800"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-light rounded-full hover:shadow-lg hover:shadow-pink-200/50 transform hover:scale-105 transition-all duration-300"
                    >
                      <span>Download App</span>
                      <span className="text-xs">✧</span>
                    </a>

                    {/* Mobile CTA */}
                    <a
                      href="https://apps.apple.com/app/id6745218800"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm:hidden p-2 text-pink-500"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </nav>

              {/* Page Content */}
              <div className="w-full flex-1">
                {children}
              </div>

              {/* Elegant Footer */}
              <footer className="relative w-full bg-gradient-to-b from-white to-pink-50/30 border-t border-pink-100/50 py-16">
                <div className="w-full max-w-7xl mx-auto px-6">
                  <div className="flex flex-col items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-light text-gray-700">
                        Lean<span className="font-semibold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">Sporty</span>
                      </span>
                      <span className="text-pink-300/50 text-sm">✦</span>
                    </div>

                    {/* Decorative Divider */}
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-pink-300 to-transparent"></div>

                    {/* Copyright */}
                    <p className="text-sm text-gray-500 font-light">
                      &copy; 2025 Lean Sporty. All rights reserved.
                    </p>

                    {/* Social Links or Additional Info */}
                    <div className="flex items-center gap-6 text-xs text-gray-400 font-light">
                      <Link href="/privacy" className="hover:text-pink-500 transition-colors">Privacy Policy</Link>
                      <span>•</span>
                      <Link href="/terms" className="hover:text-pink-500 transition-colors">Terms of Service</Link>
                      <span>•</span>
                      <Link href="/instructor/login" className="hover:text-pink-500 transition-colors">Instructor</Link>
                      <span>•</span>
                      <a href="mailto:team@leansporty.com" className="hover:text-pink-500 transition-colors">Contact</a>
                    </div>

                    {/* Theme Switcher */}
                    <div className="opacity-50 hover:opacity-100 transition-opacity">
                      <ThemeSwitcher />
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
