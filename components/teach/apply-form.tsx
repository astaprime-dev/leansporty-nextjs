"use client";

import { useActionState } from "react";
import { applyToTeachAction } from "@/app/teach/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * Instructor application form for /teach. Deliberately short (name, email,
 * where to see you teach) — the goal is a conversation, not a vetting form.
 * Mirrors the useActionState + inline-feedback pattern of lead-capture-form.
 */
export function TeachApplyForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(applyToTeachAction, null);

  if (state?.status === "success") {
    return (
      <Alert variant="success" className={className}>
        <p className="font-medium">{state.message}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="teach-name">Your name</Label>
          <Input
            id="teach-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Anna Kowalska"
            className="h-12"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teach-email">Email</Label>
          <Input
            id="teach-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12"
            aria-invalid={state?.status === "error"}
          />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="teach-social">
          Where can we watch you teach?{" "}
          <span className="font-light text-muted-foreground">
            (Instagram, YouTube, website — optional)
          </span>
        </Label>
        <Input
          id="teach-social"
          name="social"
          type="text"
          autoComplete="url"
          placeholder="instagram.com/yourhandle"
          className="h-12"
        />
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="teach-about">
          What do you teach, and who comes to your classes?{" "}
          <span className="font-light text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="teach-about"
          name="about"
          rows={4}
          placeholder="e.g. Latin dance fitness, mostly women 30–50, in-person classes twice a week plus a small Instagram following…"
        />
      </div>

      {state?.status === "error" && (
        <Alert variant="error" className="mt-4">
          {state.message}
        </Alert>
      )}

      <div className="mt-6">
        <SubmitButton
          pendingText="Sending..."
          variant="brand"
          className="h-12 w-full sm:w-auto sm:px-10"
        >
          Apply to teach
        </SubmitButton>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Applying costs nothing and commits you to nothing — it starts a
        conversation with the founder.
      </p>
    </form>
  );
}
