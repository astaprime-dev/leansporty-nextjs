"use client";

/**
 * Class times must read in the VIEWER's timezone, and this page is otherwise a
 * server component (which would format in the server's timezone). SSR paints
 * the server-zone value, hydration corrects it — suppressed as intentional.
 */
export function LocalDateTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
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
    <span suppressHydrationWarning className={className}>
      {date} · {time}
    </span>
  );
}
