"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/utils/supabase/client";

/**
 * Explicit accept step for a personal invite. Deliberately NOT auto-redeemed on
 * mount: the code is single-use and the activate route is rate-limited, so a
 * strict-mode double-fire would consume the code on the first call and show a
 * bogus failure from the second.
 */
export function AcceptInviteButton({ code }: { code: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const accept = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/instructor/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
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
            "This invite couldn't be accepted. Email inquiries@astaprime.com and we'll sort it out."
        );
      }
    } catch {
      setError(
        "Something went wrong. Please try again, or email inquiries@astaprime.com."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={accept}
        variant="brand"
        className="h-12 w-full text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading
          ? "Opening your Studio..."
          : "Accept invite & open your Studio"}
      </Button>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
