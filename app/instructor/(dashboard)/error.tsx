"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

/**
 * Studio route error boundary. Previously a failed server query silently rendered
 * empty/zero state (Studio plan S1.7); now it surfaces a recoverable error.
 */
export default function InstructorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Instructor Studio error:", error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <EmptyState
        title="Something went wrong"
        description="We couldn't load this part of your Studio. Please try again."
        action={
          <Button variant="brand" onClick={() => reset()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
