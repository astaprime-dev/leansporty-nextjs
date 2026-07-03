"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Cancel a scheduled stream with a confirm dialog (Studio plan S1.4 + S1.7).
 * Design-system AlertDialog instead of window.confirm(); inline error instead of alert().
 */
export function CancelStreamButton({ streamId }: { streamId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/instructor/streams/${streamId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not cancel the stream.");
      }
    } catch {
      setError("Could not cancel the stream. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this class?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the scheduled class and its broadcast setup. Anyone who
              enrolled will no longer see it. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancel();
              }}
              disabled={busy}
              className="bg-red-600 hover:bg-red-700"
            >
              {busy ? "Cancelling..." : "Cancel class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}
    </>
  );
}
