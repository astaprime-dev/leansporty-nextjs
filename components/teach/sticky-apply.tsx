"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only sticky CTA for /teach. Prospects arrive from Instagram DMs on
 * phones; without this, the apply button lives 8 screens of scroll away.
 * Hides itself while the #apply section is on screen (no double CTA).
 */
export function StickyApplyBar() {
  const [applyVisible, setApplyVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("apply");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setApplyVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -15% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (applyVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-pink-100 bg-white/95 p-3 backdrop-blur md:hidden">
      <Button asChild variant="brand" className="h-12 w-full text-base font-semibold">
        <a href="#apply">Apply to teach — featured keep 85%</a>
      </Button>
    </div>
  );
}
