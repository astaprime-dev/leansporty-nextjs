"use client";

import { captureLeadAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useActionState } from "react";

/**
 * Email / lead capture form (E1.7). A self-contained band for non-buyers who
 * aren't ready to checkout: leave an email, get the free Day 1. Mirrors the
 * useActionState + inline-feedback pattern of components/auth-form.tsx.
 *
 * `source` is recorded with the lead for attribution (e.g. 'challenge-exit',
 * 'homepage'). Drop it on any marketing surface with a distinct source.
 */
export function LeadCaptureForm({
  source,
  title = "Not ready to commit?",
  description = "Leave your email and try Day 1 free — short, joyful dance workouts you can do at home, no equipment.",
  className,
}: {
  source: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(captureLeadAction, null);

  return (
    <div className={className}>
      <h2 className="font-display text-center text-3xl font-light text-gray-900">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
        {description}
      </p>

      {state?.status === "success" ? (
        <Alert variant="success" className="mx-auto mt-6 max-w-md">
          <p className="font-medium">{state.message}</p>
        </Alert>
      ) : (
        <form
          action={formAction}
          className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input type="hidden" name="source" value={source} />
          <Input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 flex-1"
            aria-invalid={state?.status === "error"}
          />
          <SubmitButton
            pendingText="Sending..."
            variant="brand"
            className="h-12 shrink-0"
          >
            Send my free Day 1
          </SubmitButton>
        </form>
      )}

      {state?.status === "error" && (
        <Alert variant="error" className="mx-auto mt-3 max-w-md">
          {state.message}
        </Alert>
      )}
    </div>
  );
}
