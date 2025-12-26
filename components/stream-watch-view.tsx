"use client";

import { LiveStreamSession, StreamEnrollment } from "@/types/streaming";
import { CloudflareStreamPlayer } from "@/components/CloudflareStreamPlayer";
import { WHEPPlayer } from "@/components/whep-player";
import { ReactionButtons } from "@/components/stream/reaction-buttons";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";

interface StreamWatchViewProps {
  stream: LiveStreamSession;
  enrollment: StreamEnrollment;
  isLive: boolean;
}

export function StreamWatchView({
  stream,
  enrollment,
  isLive,
}: StreamWatchViewProps) {
  // For live streams, we need the WHEP playback URL
  // For recordings, we use the regular playback ID
  const whepUrl = isLive ? stream.cloudflare_whep_playback_url : null;
  const recordingPlaybackId = !isLive ? stream.recording_cloudflare_video_id : null;

  // Check if we have the necessary URLs
  if (isLive && !whepUrl) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-xl text-gray-600 mb-4">Stream not available</p>
          <p className="text-sm text-gray-500">
            The stream is not broadcasting yet. Please check back at the scheduled time.
          </p>
        </div>
      </div>
    );
  }

  if (!isLive && !recordingPlaybackId) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-xl text-gray-600 mb-4">Recording not available</p>
          <p className="text-sm text-gray-500">
            The recording is not available at this time.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4 py-8 max-w-7xl mx-auto">
      {/* Video Player + Reaction Buttons */}
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Video Player */}
        <div className="flex-1">
          {isLive && whepUrl ? (
            /* Live stream uses WHEP (WebRTC) for sub-second latency */
            <WHEPPlayer
              whepUrl={whepUrl}
              autoplay={true}
              muted={false}
              poster={stream.thumbnail_url || undefined}
            />
          ) : recordingPlaybackId ? (
            /* Recordings use regular HLS playback */
            <CloudflareStreamPlayer
              playbackId={recordingPlaybackId}
              autoplay={false}
              controls={true}
              poster={stream.thumbnail_url || undefined}
            />
          ) : null}
        </div>

        {/* Reaction Buttons Sidebar (Desktop) - Only shown during live streams */}
        <ReactionButtons streamId={stream.id} isLive={isLive} />
      </div>

      {/* Stream Info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">
              {stream.title}
            </h1>
            {stream.instructor_name && (
              <p className="text-lg text-gray-600">
                with <span className="font-semibold">{stream.instructor_name}</span>
              </p>
            )}
          </div>

          {/* Live badge */}
          {isLive && (
            <Badge className="bg-red-500 text-white px-4 py-2 text-base flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              LIVE
            </Badge>
          )}
        </div>

        {/* Description */}
        {stream.description && (
          <p className="text-gray-600 text-lg">{stream.description}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-sm text-gray-600 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            <span>{formatDate(stream.scheduled_start_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-pink-500" />
            <span>{formatDuration(stream.scheduled_duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-500" />
            <span>{stream.total_enrollments} enrolled</span>
          </div>
        </div>

        {/* Replay expiry notice */}
        {!isLive && enrollment.replay_access_expires_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800 font-medium">
              🕒 Replay Access
            </p>
            <p className="text-sm text-amber-700 mt-1">
              This replay is available until{" "}
              {formatDate(enrollment.replay_access_expires_at)}
            </p>
          </div>
        )}

        {/* Enrollment confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ You're enrolled in this stream ({enrollment.tokens_paid} tokens)
          </p>
        </div>
      </div>
    </div>
  );
}
