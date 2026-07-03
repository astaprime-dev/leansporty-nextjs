"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

/**
 * Hide / unhide a comment on the instructor's own stream (Studio plan S1.6).
 * Calls the existing PATCH /api/comments/[id]/moderate route. Optimistic-free:
 * refreshes the server component on success so the badge/opacity update.
 */
export function CommentModerationButton({
  commentId,
  isHidden,
}: {
  commentId: string;
  isHidden: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !isHidden }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={busy}>
      {isHidden ? (
        <>
          <Eye className="w-4 h-4 mr-1" /> Unhide
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4 mr-1" /> Hide
        </>
      )}
    </Button>
  );
}
