"use client";

import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Coins, Users, Download } from "lucide-react";
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
  const router = useRouter();

  const handleEnroll = async () => {
    setIsEnrolling(true);
    const result = await enrollInStream(stream.id);

    if (result.success) {
      router.refresh(); // Refresh to show enrollment status
    } else {
      alert(result.error || "Enrollment failed. Please try again.");
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
    <div className="group relative bg-white rounded-2xl border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-6">
        {/* Thumbnail */}
        <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-pink-50 to-rose-50">
          {stream.thumbnail_url ? (
            <Image
              src={stream.thumbnail_url}
              alt={stream.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 256px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🎥</span>
            </div>
          )}

          {/* Live badge */}
          {isLive && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              LIVE
            </div>
          )}

          {/* Duration badge */}
          {!isLive && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
              {formatDuration(stream.scheduled_duration_seconds)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800 group-hover:text-pink-500 transition-colors">
              {stream.title}
            </h2>

            {stream.instructor_name && (
              <p className="text-gray-600 mb-3">
                with <span className="font-semibold">{stream.instructor_name}</span>
              </p>
            )}

            {stream.description && (
              <p className="text-gray-500 mb-4 line-clamp-2">{stream.description}</p>
            )}

            {/* Stream info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-500" />
                <span>
                  {time} • {formatDuration(stream.scheduled_duration_seconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" />
                <span>{stream.total_enrollments} enrolled</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {enrollment ? (
              <>
                {/* Enrolled - show watch button */}
                <Link href={`/streams/${stream.id}/watch`}>
                  <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500">
                    {isLive ? "Watch Live" : "View Details"}
                  </Button>
                </Link>
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  ✓ Enrolled
                </Badge>
              </>
            ) : !isAuthenticated ? (
              <>
                {/* Not authenticated - show sign in modal */}
                <OAuthSignInModal>
                  <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500">
                    Sign in to Enroll
                  </Button>
                </OAuthSignInModal>
                <div className="flex items-center gap-2 text-gray-700">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">{stream.price_in_tokens} tokens</span>
                </div>
              </>
            ) : (
              <>
                {/* Authenticated but not enrolled - show enroll button */}
                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Now"}
                </Button>
                <div className="flex items-center gap-2 text-gray-700">
                  <Coins className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">{stream.price_in_tokens} tokens</span>
                </div>
              </>
            )}

            {/* Calendar download (only for upcoming streams) */}
            {!isLive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCalendar}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
