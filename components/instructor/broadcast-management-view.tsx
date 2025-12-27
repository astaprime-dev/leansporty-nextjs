"use client";

import { LiveStreamSession } from "@/types/streaming";
import { BrowserBroadcast } from "@/components/instructor/browser-broadcast";
import { ReactionDisplay } from "@/components/instructor/reaction-display";
import { LiveViewerCount } from "@/components/stream/live-viewer-count";
import { CommentList } from "@/components/stream/comment-list";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Coins, Users, Copy, Check } from "lucide-react";

interface BroadcastManagementViewProps {
  stream: LiveStreamSession;
}

export function BroadcastManagementView({ stream }: BroadcastManagementViewProps) {
  const [streamStatus, setStreamStatus] = useState(stream.status);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleMarkLive = async () => {
    const response = await fetch(`/api/instructor/streams/${stream.id}/start`, {
      method: "POST",
    });

    if (response.ok) {
      setStreamStatus("live");
      router.refresh();
    }
  };

  const handleEndStream = async () => {
    if (!confirm("Are you sure you want to end this stream?")) return;

    const response = await fetch(`/api/instructor/streams/${stream.id}/end`, {
      method: "POST",
    });

    if (response.ok) {
      setStreamStatus("ended");
      router.refresh();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Broadcast */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{stream.title}</h1>
            <p className="text-gray-600">{stream.description}</p>
          </div>

          {/* Broadcast Component */}
          {stream.cloudflare_webrtc_url && (
            <div className="relative">
              <BrowserBroadcast
                webrtcUrl={stream.cloudflare_webrtc_url}
                webrtcToken={stream.cloudflare_webrtc_token || undefined}
                onStreamStart={handleMarkLive}
                onStreamEnd={handleEndStream}
              />
              {/* Reaction Display Overlay - Shows viewer reactions in real-time */}
              <ReactionDisplay
                streamId={stream.id}
                isLive={streamStatus === "live"}
              />
            </div>
          )}

          {/* Stream Info */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-bold text-lg">Stream Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span suppressHydrationWarning>
                  {formatDate(stream.scheduled_start_time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{formatDuration(stream.scheduled_duration_seconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>{stream.price_in_tokens} tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{stream.total_enrollments} enrolled</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold text-lg mb-6">Viewer Comments</h2>
            <CommentList
              streamId={stream.id}
              isInstructor={true}
              instructorId={stream.instructor_id}
            />
          </div>
        </div>

        {/* Right Column - Controls & Stats */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-bold mb-4">Stream Status</h3>
            <div className="space-y-3">
              <div
                className={`px-4 py-2 rounded-lg text-center font-semibold ${
                  streamStatus === "live"
                    ? "bg-red-100 text-red-700"
                    : streamStatus === "scheduled"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {streamStatus.toUpperCase()}
              </div>

              {streamStatus === "scheduled" && (
                <Button
                  onClick={handleMarkLive}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  Mark as Live
                </Button>
              )}

              {streamStatus === "live" && (
                <Button
                  onClick={handleEndStream}
                  variant="destructive"
                  className="w-full"
                >
                  End Stream
                </Button>
              )}
            </div>
          </div>

          {/* Live Viewer Count - Only show when stream is live */}
          {streamStatus === "live" && (
            <LiveViewerCount
              streamId={stream.id}
              showDetails={true}
              variant="full"
            />
          )}

          {/* Stats Card */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-bold mb-4">Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold">{stream.total_enrollments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue (tokens)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stream.total_enrollments * stream.price_in_tokens}
                </p>
              </div>
              {stream.max_viewers > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Peak Viewers</p>
                  <p className="text-2xl font-bold">{stream.max_viewers}</p>
                </div>
              )}
            </div>
          </div>

          {/* WebRTC Info Card */}
          {/* {stream.cloudflare_webrtc_url && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <span>🌐</span>
                WebRTC Connection
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Browser-based streaming (no software needed)
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">Connection URL:</p>
                  <div className="bg-white rounded p-2 flex items-center gap-2">
                    <code className="text-xs flex-1 truncate">
                      {stream.cloudflare_webrtc_url.substring(0, 40)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(stream.cloudflare_webrtc_url!)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* Help Card */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium mb-2">How to Broadcast</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Click "Start Broadcast"</li>
              <li>Allow camera & microphone access</li>
              <li>Wait for "LIVE" indicator</li>
              <li>Start your workout!</li>
              <li>Click "Stop Broadcast" when done</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
