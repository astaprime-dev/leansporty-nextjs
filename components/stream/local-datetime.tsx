"use client";

import { useEffect, useState } from "react";

/**
 * Class times must read in the VIEWER's timezone, and this page is otherwise a
 * server component (which would format in the server's timezone — UTC on
 * Vercel). suppressHydrationWarning is NOT enough here: React leaves the
 * mismatched server text in place, so the wrong-timezone string would stick.
 * Render a placeholder until mounted, then format with the browser's clock.
 */
export function LocalDateTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={className}>…</span>;
  }

  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <span className={className}>
      {date} · {time}
    </span>
  );
}
