"use client";

import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { StreamCard } from "@/components/stream-card";
import { Button } from "@/components/ui/button";
import { OAuthSignInModal } from "@/components/oauth-signin-modal";

interface StreamsViewProps {
  liveStreams: LiveStreamSession[];
  upcomingStreams: LiveStreamSession[];
  enrollments: StreamEnrollment[];
  isAuthenticated: boolean;
  notice?: string;
}

export function StreamsView({
  liveStreams,
  upcomingStreams,
  enrollments,
  isAuthenticated,
  notice,
}: StreamsViewProps) {
  // Create a map of enrollments for quick lookup
  const enrollmentMap = new Map(enrollments.map((e) => [e.stream_id, e]));

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 py-8 max-w-7xl mx-auto">
      {/* Recovery notice — e.g. redirected here from a class watch page */}
      {notice === "signin" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-200 bg-pink-50 px-4 py-3">
          <p className="text-sm text-pink-800">
            Please sign in to watch live classes.
          </p>
          <OAuthSignInModal>
            <Button
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
            >
              Sign in
            </Button>
          </OAuthSignInModal>
        </div>
      )}
      {notice === "enroll" && (
        <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-3">
          <p className="text-sm text-pink-800">
            You&apos;re not enrolled in that class yet — choose a class below to enroll.
          </p>
        </div>
      )}
      {notice === "notfound" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">That class is no longer available.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-display font-light text-gray-900 mb-2">
            Live Streams
          </h1>
          <p className="text-muted-foreground">
            Join live dance workouts with expert instructors
          </p>
        </div>
      </div>

      {/* LIVE NOW Section */}
      {liveStreams.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span>LIVE NOW</span>
          </h2>
          <div className="grid gap-6">
            {liveStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                enrollment={enrollmentMap.get(stream.id)}
                isLive={true}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Streams</h2>
        {upcomingStreams.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
            <p className="text-lg text-gray-600 mb-2">
              No upcoming streams scheduled yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back soon for new live sessions!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcomingStreams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                enrollment={enrollmentMap.get(stream.id)}
                isLive={false}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
