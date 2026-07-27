"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { ConnectState } from "@/lib/connect-accounts";

/**
 * The Stripe option inside the "How you get paid" card (payout-method-card) —
 * the entry point to Stripe-hosted Connect onboarding. Plain-English copy;
 * every state ends in one clear action (or none, when active). The button
 * mints a fresh Account Link each time (links are single-use), so it doubles
 * as "Continue setup" and "Update details".
 */
export function ConnectOnboardingCard({ state }: { state: ConnectState }) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/instructor/connect/onboarding", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open Stripe. Please try again.");
        setRedirecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not open Stripe. Please try again.");
      setRedirecting(false);
    }
  };

  const cta = (label: string) => (
    <Button type="button" variant="brand" onClick={start} disabled={redirecting}>
      {redirecting ? "Opening Stripe…" : label}
      {!redirecting && <ExternalLink className="ml-1.5 h-4 w-4" />}
    </Button>
  );

  return (
    <div>
      {state === "not_started" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We send your earnings through Stripe, the payment provider that also
            handles your students&apos; purchases. Setting up takes about 5
            minutes — you&apos;ll add your bank account and confirm your
            identity on Stripe&apos;s secure page, then come back here.
          </p>
          {cta("Set up payouts")}
        </div>
      )}

      {state === "in_progress" && (
        <div className="space-y-4">
          <Alert variant="info">
            You started setting up payouts but didn&apos;t finish. Continue
            where you left off — it only takes a few minutes.
          </Alert>
          {cta("Continue setup")}
        </div>
      )}

      {state === "under_review" && (
        <div className="space-y-4">
          <Alert variant="info">
            Stripe is reviewing your details. This usually takes minutes,
            sometimes up to a day — no action needed from you. We&apos;ll show
            payouts as active here as soon as the review is done.
          </Alert>
        </div>
      )}

      {state === "restricted" && (
        <div className="space-y-4">
          <Alert variant="warning">
            Stripe needs more information before we can pay you. Open Stripe to
            see what&apos;s missing and add it — your earnings keep adding up in
            the meantime.
          </Alert>
          {cta("Update details")}
        </div>
      )}

      {state === "active" && (
        <p className="text-sm text-gray-600">
          Payouts are active. Your pending earnings are included in the next
          monthly payout run (€20 minimum — smaller balances roll over), and
          Stripe sends the money straight to your bank account.
        </p>
      )}

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </div>
  );
}
