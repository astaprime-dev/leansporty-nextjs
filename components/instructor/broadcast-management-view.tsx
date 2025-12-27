"use client";

import { LiveStreamSession } from "@/types/streaming";
import { BrowserBroadcast } from "@/components/instructor/browser-broadcast";
import { ReactionDisplay } from "@/components/instructor/reaction-display";
import { LiveViewerCount } from "@/components/stream/live-viewer-count";
import { CommentList } from "@/components/stream/comment-list";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Coins, Users, Copy, Check, AlertCircle, ChevronDown, ChevronUp, Video } from "lucide-react";

interface BroadcastManagementViewProps {
  stream: LiveStreamSession;
}

export function BroadcastManagementView({ stream }: BroadcastManagementViewProps) {
  const [streamStatus, setStreamStatus] = useState(stream.status);
  const [copied, setCopied] = useState(false);
  const [showRTMPS, setShowRTMPS] = useState(false);
  const router = useRouter();

  // Detect if this is a reconnection scenario
  // (stream is already live but this device isn't currently broadcasting)
  const isReconnection = streamStatus === "live" && stream.actual_start_time !== null;

  // Add browser warning when trying to leave page while stream is live
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (streamStatus === "live") {
        e.preventDefault();
        e.returnValue = "Your stream is still live. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [streamStatus]);

  const handleMarkLive = async (isWebRTC = false) => {
    const body = isWebRTC ? { method: 'webrtc' } : {};
    const response = await fetch(`/api/instructor/streams/${stream.id}/start`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
          {stream.cloudflare_webrtc_url && streamStatus !== "ended" && (
            <div className="relative">
              <BrowserBroadcast
                webrtcUrl={stream.cloudflare_webrtc_url}
                webrtcToken={stream.cloudflare_webrtc_token || undefined}
                isReconnection={isReconnection}
                onStreamStart={() => handleMarkLive(true)}
                onStreamEnd={handleEndStream}
              />
              {/* Reaction Display Overlay - Shows viewer reactions in real-time */}
              <ReactionDisplay
                streamId={stream.id}
                isLive={streamStatus === "live"}
              />
            </div>
          )}

          {/* Message when stream has ended */}
          {streamStatus === "ended" && (
            <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Check className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Stream Has Ended</h3>
                <p className="text-gray-600 mb-6">
                  This class has finished. The recording is now available to enrolled students for 7 days.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => router.push("/instructor/streams")}
                    variant="outline"
                  >
                    Back to Streams
                  </Button>
                  <Button
                    onClick={() => router.push("/instructor/streams/create")}
                    className="bg-gradient-to-r from-pink-500 to-rose-400"
                  >
                    Create New Stream
                  </Button>
                </div>
              </div>
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

          {/* Advanced: RTMPS for OBS */}
          {stream.cloudflare_rtmps_url && stream.cloudflare_rtmps_stream_key && streamStatus !== "ended" && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 space-y-4">
              <button
                onClick={() => setShowRTMPS(!showRTMPS)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-900">Advanced: Stream with OBS (Recording Available)</h3>
                </div>
                {showRTMPS ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </button>

              {showRTMPS && (
                <div className="space-y-4 pt-2">
                  <div className="bg-blue-100/50 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">RTMPS streaming supports recording!</p>
                        <p>Use OBS or similar software to stream. Your class will be automatically recorded and available to students for 7 days.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Server URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={stream.cloudflare_rtmps_url}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(stream.cloudflare_rtmps_url!)}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Stream Key</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={stream.cloudflare_rtmps_stream_key}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(stream.cloudflare_rtmps_stream_key!)}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 pt-2">
                      <p className="font-semibold">Quick OBS Setup:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open OBS Studio</li>
                        <li>Settings → Stream → Service: Custom</li>
                        <li>Paste Server URL and Stream Key above</li>
                        <li>Click Start Streaming in OBS</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  onClick={() => handleMarkLive()}
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
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Guide</h4>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Starting Your Stream</p>
              <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                <li>Click <strong>"Start Broadcast"</strong></li>
                <li>Allow camera & microphone access</li>
                <li>Wait for red <strong>"LIVE"</strong> badge (3-5 seconds)</li>
                <li>You're live - students can now watch</li>
              </ol>
            </div>

            <div className="pt-3 border-t border-pink-200">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Ending Your Stream</p>
              <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                <li>Click <strong>"Stop Broadcast"</strong></li>
                <li>Confirm when asked</li>
                <li>Done - recording becomes available to students</li>
              </ol>
            </div>

            <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-pink-200">
              Tip: Everything is automatic - just click one button to start and one to stop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
