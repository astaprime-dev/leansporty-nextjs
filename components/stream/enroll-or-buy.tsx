"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { Button } from "@/components/ui/button";
import { enrollInStream } from "@/app/actions";
import { downloadICS } from "@/lib/ics-generator";
import { isMissedScheduledClass } from "@/lib/stream-time";
import { OAuthSignInModal } from "@/components/oauth-signin-modal";

/**
 * Hero-sized enroll/buy CTA for the public class page — the same decision tree
 * as StreamCard's action row (sign-in modal → Stripe checkout → free enroll).
 * Ended classes are rendered by the page itself, not here.
 */
export function EnrollOrBuy({
  stream,
  enrollment,
  isAuthenticated,
}: {
  stream: LiveStreamSession;
  enrollment: StreamEnrollment | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed after mount (client clock) so SSR and hydration agree; the checkout
  // route and enrollInStream enforce the same rule server-side.
  const [isMissed, setIsMissed] = useState(false);
  useEffect(() => {
    setIsMissed(isMissedScheduledClass(stream));
  }, [stream]);

  const isLive = stream.status === "live";
  const isPaid = !!stream.product && stream.product.price_cents > 0;
  const priceLabel = isPaid
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (stream.product!.currency || "eur").toUpperCase(),
      }).format(stream.product!.price_cents / 100)
    : null;

  const handleBuy = async () => {
    if (!stream.product) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: stream.product.slug,
          returnPath: `/streams/${stream.id}/watch?purchased=1`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.alreadyOwned) {
        router.push(`/streams/${stream.id}/watch`);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        res.status === 410
          ? "This class's scheduled time has passed."
          : "We couldn't start checkout. Please try again."
      );
    } catch {
      setError("We couldn't start checkout. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleEnroll = async () => {
    setIsBusy(true);
    setError(null);
    const result = await enrollInStream(stream.id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Enrollment failed. Please try again.");
    }
    setIsBusy(false);
  };

  const handleDownloadCalendar = () => {
    const watchUrl = `${window.location.origin}/streams/${stream.id}/watch`;
    downloadICS(stream, watchUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {enrollment ? (
          <Button asChild variant="brand" className="h-12 flex-1 text-base font-semibold">
            <Link href={`/streams/${stream.id}/watch`}>
              {isLive ? "Watch live now" : "Open your class"}
            </Link>
          </Button>
        ) : isMissed ? (
          <Button disabled variant="outline" className="h-12 flex-1 text-base">
            Class time has passed
          </Button>
        ) : !isAuthenticated ? (
          <OAuthSignInModal
            next={`/streams/${stream.id}`}
            title="Join this class"
            description={
              isPaid
                ? "Sign in first, then buy your spot — takes a minute, no password needed."
                : "Sign in to save your free spot — takes a minute, no password needed."
            }
          >
            <Button variant="brand" className="h-12 flex-1 text-base font-semibold">
              {isPaid ? `Sign in to buy — ${priceLabel}` : "Sign in to enroll free"}
            </Button>
          </OAuthSignInModal>
        ) : isPaid ? (
          <Button
            onClick={handleBuy}
            disabled={isBusy}
            variant="brand"
            className="h-12 flex-1 text-base font-semibold"
          >
            {isBusy ? "Starting checkout…" : `Buy your spot — ${priceLabel}`}
          </Button>
        ) : (
          <Button
            onClick={handleEnroll}
            disabled={isBusy}
            variant="brand"
            className="h-12 flex-1 text-base font-semibold"
          >
            {isBusy ? "Enrolling…" : "Enroll free"}
          </Button>
        )}

        {!isLive && !isMissed && (
          <Button
            variant="outline"
            onClick={handleDownloadCalendar}
            className="h-12 shrink-0 border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Download className="mr-2 h-4 w-4" /> Add to calendar
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!enrollment && !isMissed && (
        <p className="text-sm text-gray-500">
          {isPaid
            ? "One-time payment — watch live, and rewatch for 7 days after the class."
            : "Free class — save your spot and join live."}
        </p>
      )}
    </div>
  );
}
