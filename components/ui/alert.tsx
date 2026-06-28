import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One notice/banner treatment for the whole app. Same meaning → same look:
 * one radius, one padding, one color per variant. Replaces the ad-hoc
 * bg-{pink,blue,green,amber,red}-50 banners scattered across pages.
 */
const alertVariants = cva(
  "flex items-start gap-3 rounded-2xl border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-pink-200 bg-pink-50 text-pink-800",
        success: "border-green-200 bg-green-50 text-green-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        error: "border-red-200 bg-red-50 text-red-800",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Hide the leading icon. */
  hideIcon?: boolean;
}

export function Alert({
  className,
  variant = "info",
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {!hideIcon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
