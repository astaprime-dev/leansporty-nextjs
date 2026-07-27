"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/utils/supabase/client";

/**
 * Explicit accept step for a personal invite. Deliberately NOT auto-redeemed on
 * mount: the code is single-use and the activate route is rate-limited, so a
 * strict-mode double-fire would consume the code on the first call and show a
 * bogus failure from the second.
 *
 * The Instructor Agreement checkbox is required — the API rejects activation
 * without it (before consuming the code), and logs the accepted version.
 */
export function AcceptInviteButton({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  const accept = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/instructor/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code, agreementAccepted: agreed }),
      });

      if (response.ok) {
        // Refresh the session so the new JWT carries the instructor role.
        const supabase = createClient();
        await supabase.auth.refreshSession();
        router.push("/instructor/profile?welcome=1");
        return;
      }

      const body = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setError("Too many attempts — please wait 10 minutes and try again.");
      } else {
        setError(
          body.error ||
            "This invite couldn't be accepted. Reach us via leansporty.com/contact and we'll sort it out."
        );
      }
    } catch {
      setError(
        "Something went wrong. Please try again, or reach us via leansporty.com/contact."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/instructor-agreement"
            target="_blank"
            className="font-semibold text-pink-600 underline hover:text-pink-500"
          >
            Instructor Agreement
          </Link>{" "}
          — the plain-English terms of teaching here (your 80–85% share, monthly
          payouts, and what happens with recordings).
        </span>
      </label>
      <Button
        onClick={accept}
        variant="brand"
        className="h-12 w-full text-base font-semibold"
        disabled={isLoading || !agreed}
      >
        {isLoading
          ? "Opening your Studio..."
          : "Accept invite & open your Studio"}
      </Button>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
