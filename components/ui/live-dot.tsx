import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
  xl: "h-3 w-3",
} as const;

interface LiveDotProps {
  size?: keyof typeof sizeClasses;
  /** Set false to render a static dot (e.g. an "off air" state). */
  pulse?: boolean;
  className?: string;
}

/**
 * Pulsing "on air" indicator. Color comes from the current text color
 * (bg-current) — pass e.g. `className="text-white"` inside a red LIVE badge,
 * or `className="text-red-500"` on a light background.
 */
export function LiveDot({ size = "md", pulse = true, className }: LiveDotProps) {
  return (
    <span className={cn("relative flex", sizeClasses[size], className)}>
      {pulse && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
      )}
      <span className="relative inline-flex h-full w-full rounded-full bg-current" />
    </span>
  );
}
