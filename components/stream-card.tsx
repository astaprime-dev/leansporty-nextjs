"use client";

import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Users, Download, Video, Check } from "lucide-react";
import { enrollInStream } from "@/app/actions";
import { downloadICS } from "@/lib/ics-generator";
import { OAuthSignInModal } from "@/components/oauth-signin-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StreamCardProps {
  stream: LiveStreamSession;
  enrollment?: StreamEnrollment;
  isLive: boolean;
  isAuthenticated: boolean;
}

export function StreamCard({ stream, enrollment, isLive, isAuthenticated }: StreamCardProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const router = useRouter();

  const isPaid = !!stream.product && stream.product.price_cents > 0;
  const priceLabel = isPaid
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: (stream.product!.currency || "eur").toUpperCase(),
      }).format(stream.product!.price_cents / 100)
    : null;

  const handleBuy = async () => {
    if (!stream.product) return;
    setIsBuying(true);
    setEnrollError(null);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: stream.product.slug,
          returnPath: `/streams/${stream.id}/watch`,
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
      setEnrollError("We couldn't start checkout. Please try again.");
    } catch {
      setEnrollError("We couldn't start checkout. Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    setEnrollError(null);
    const result = await enrollInStream(stream.id);

    if (result.success) {
      router.refresh(); // Refresh to show enrollment status
    } else {
      setEnrollError(result.error || "Enrollment failed. Please try again.");
    }

    setIsEnrolling(false);
  };

  const handleDownloadCalendar = () => {
    const watchUrl = `${window.location.origin}/streams/${stream.id}/watch`;
    downloadICS(stream, watchUrl);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const { date, time } = formatDateTime(stream.scheduled_start_time);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-200/50">
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
        {stream.thumbnail_url ? (
          <Image
            src={stream.thumbnail_url}
            alt={stream.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="h-10 w-10 text-pink-300" strokeWidth={1.5} />
          </div>
        )}

        {/* Live badge (top-left) */}
        {isLive && (
          <Badge
            variant="live"
            className="absolute left-3 top-3 gap-1.5 rounded-full px-3 py-1 text-xs shadow-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
            </span>
            LIVE
          </Badge>
        )}

        {/* Status / price (top-right) */}
        <div className="absolute right-3 top-3">
          {enrollment ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              <Check className="h-3 w-3" strokeWidth={2.5} /> Enrolled
            </span>
          ) : isPaid ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
              {priceLabel}
            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-green-600 shadow-sm backdrop-blur-sm">
              Free
            </span>
          )}
        </div>

        {/* Duration (bottom-right) */}
        <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          {formatDuration(stream.scheduled_duration_seconds)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-pink-500">
          {stream.title}
        </h3>

        {stream.instructor && (
          <p className="mt-1 text-sm text-gray-600">
            with{" "}
            <Link
              href={`/@${stream.instructor.slug}`}
              className="font-semibold text-gray-900 transition-colors hover:text-pink-500"
            >
              {stream.instructor.display_name}
            </Link>
          </p>
        )}

        {stream.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {stream.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-pink-400" /> {date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-pink-400" /> {time}
          </span>
          {stream.total_enrollments > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-pink-400" /> {stream.total_enrollments} enrolled
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 border-t border-pink-50 pt-4">
          {enrollment ? (
            <Button asChild variant="brand" className="flex-1">
              <Link href={`/streams/${stream.id}/watch`}>
                {isLive ? "Watch live" : "View class"}
              </Link>
            </Button>
          ) : !isAuthenticated ? (
            <OAuthSignInModal>
              <Button variant="brand" className="flex-1">
                {isPaid ? "Sign in to buy" : "Sign in to enroll"}
              </Button>
            </OAuthSignInModal>
          ) : isPaid ? (
            <Button
              onClick={handleBuy}
              disabled={isBuying}
              variant="brand"
              className="flex-1"
            >
              {isBuying ? "Starting checkout…" : `Buy for ${priceLabel}`}
            </Button>
          ) : (
            <Button
              onClick={handleEnroll}
              disabled={isEnrolling}
              variant="brand"
              className="flex-1"
            >
              {isEnrolling ? "Enrolling…" : "Enroll now"}
            </Button>
          )}

          {!isLive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCalendar}
              aria-label="Add to calendar"
              className="shrink-0 border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {enrollError && (
          <p className="mt-3 text-sm text-red-600">{enrollError}</p>
        )}
      </div>
    </div>
  );
}
