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
}: {
  children: React.ReactNode;
  /** Path to return to after auth (intent resume), e.g. a checkout flow. */
  next?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-gray-900">
            Welcome to Lean Sporty
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Sign in to access your workouts and track your progress
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AuthForm next={next} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
