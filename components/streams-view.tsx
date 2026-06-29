"use client";

import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { StreamCard } from "@/components/stream-card";
import { Button } from "@/components/ui/button";
import { OAuthSignInModal } from "@/components/oauth-signin-modal";
import { EmptyState } from "@/components/empty-state";
import { Alert } from "@/components/ui/alert";

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
        <Alert variant="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Please sign in to watch live classes.</p>
            <OAuthSignInModal>
              <Button variant="brand" size="sm">
                Sign in
              </Button>
            </OAuthSignInModal>
          </div>
        </Alert>
      )}
      {notice === "enroll" && (
        <Alert variant="info">
          You&apos;re not enrolled in that class yet — choose a class below to enroll.
        </Alert>
      )}
      {notice === "notfound" && (
        <Alert variant="warning">That class is no longer available.</Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900 mb-2">
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
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
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Upcoming Streams</h2>
        {upcomingStreams.length === 0 ? (
          <EmptyState
            title="No upcoming streams scheduled yet."
            description="Check back soon for new live sessions!"
          />
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
