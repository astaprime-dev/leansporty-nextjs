import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared empty-state card — one consistent treatment across list pages
 * (Activity, Streams, …): soft pink card, centered message, optional action.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-rose-50 px-6 py-14 text-center",
        className
      )}
    >
      <p className="text-lg text-gray-700">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
