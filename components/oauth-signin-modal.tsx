"use client";

import { AuthForm } from "@/components/auth-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function OAuthSignInModal({
  children,
  next,
  title = "Welcome to Lean Sporty",
  description = "Sign in to access your workouts and track your progress",
  defaultOpen = false,
}: {
  /** Trigger element; omit when the modal opens itself via `defaultOpen`. */
  children?: React.ReactNode;
  /** Path to return to after auth (intent resume), e.g. a checkout flow. */
  next?: string;
  /** Contextual copy — e.g. the checkout flow explains why an account first. */
  title?: string;
  description?: string;
  /** Open immediately on mount (e.g. landing with ?intent=checkout). */
  defaultOpen?: boolean;
}) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AuthForm next={next} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
