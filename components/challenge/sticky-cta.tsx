"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/challenge/cta";

/**
 * Mobile-only sticky buy bar: appears once the hero CTAs scroll out of view,
 * so the moment of "okay, I'm in" always has a button in reach on a long
 * sales page. Hidden for owners and on md+ screens.
 */
export function MobileStickyCta({
  productSlug,
  isAuthenticated,
  owned,
  priceLabel,
  heroCtaId = "challenge-hero-cta",
  label,
}: {
  productSlug: string;
  isAuthenticated: boolean;
  owned: boolean;
  priceLabel: string;
  /** id of the hero CTA row whose disappearance summons the bar. */
  heroCtaId?: string;
  /** Button label; defaults to the challenge wording. */
  label?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroCtaId);
    if (!hero) return;
    const obs = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    obs.observe(hero);
    return () => obs.disconnect();
  }, [heroCtaId]);

  if (owned || !show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden">
      <CheckoutButton
        productSlug={productSlug}
        isAuthenticated={isAuthenticated}
        owned={owned}
        next="/challenge?intent=checkout"
        label={label ?? `Start the Challenge — ${priceLabel}`}
        className="h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-base font-semibold text-white hover:from-pink-600 hover:to-rose-500"
      />
    </div>
  );
}
