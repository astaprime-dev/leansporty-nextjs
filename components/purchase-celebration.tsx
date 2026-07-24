"use client";

import { useRouter } from "next/navigation";
import { PartyPopper, X } from "lucide-react";

/**
 * The post-purchase moment: she just bought — greet it like the occasion it
 * is, don't render a bureaucratic grid. Shown when the page is reached with
 * ?purchased=1 and the entitlement has landed; dismissing cleans the URL so
 * refreshes don't re-celebrate.
 */
export function PurchaseCelebration({
  heading,
  message,
  clearPath,
}: {
  heading: string;
  message: string;
  /** URL to replace to when dismissed (the same page without ?purchased). */
  clearPath: string;
}) {
  const router = useRouter();
  return (
    <div className="animate-fade-up relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 p-5 text-white shadow-lg sm:p-6">
      {/* soft glow accents */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => router.replace(clearPath, { scroll: false })}
        className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <PartyPopper className="mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <p className="text-lg font-semibold leading-snug">{heading}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">{message}</p>
        </div>
      </div>
    </div>
  );
}
