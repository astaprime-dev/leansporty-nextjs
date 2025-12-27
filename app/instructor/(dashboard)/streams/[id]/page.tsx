import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveStreamSession } from "@/types/streaming";
import { StreamAnalytics } from "@/components/instructor/stream-analytics";
import { CloudflareStreamPlayer } from "@/components/CloudflareStreamPlayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Coins,
  Users,
  Edit,
  Radio,
  TrendingUp,
  ArrowLeft,
  PlayCircle,
} from "lucide-react";

export default async function StreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Verify instructor access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!instructorProfile) {
    redirect("/instructor/profile");
  }

  // Fetch stream details
  const { data: stream, error } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", instructorProfile.id)
    .single();

  if (error || !stream) {
    redirect("/instructor/streams");
  }

  const streamData = stream as LiveStreamSession;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
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
      {/* Back Button */}
      <Link
        href="/instructor/streams"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-500 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Streams
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {streamData.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  streamData.status === "live"
                    ? "bg-red-100 text-red-700"
                    : streamData.status === "scheduled"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {streamData.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600">{streamData.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {streamData.status === "scheduled" && (
              <Link href={`/instructor/streams/${id}/broadcast`}>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500">
                  <Radio className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </Link>
            )}
            {streamData.status === "live" && (
              <Link href={`/instructor/streams/${id}/broadcast`}>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Radio className="w-4 h-4 mr-2" />
                  Manage Broadcast
                </Button>
              </Link>
            )}
            <Link href={`/instructor/streams/${id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <p className="text-sm">Scheduled</p>
            </div>
            <p className="text-lg font-semibold" suppressHydrationWarning>
              {formatDate(streamData.scheduled_start_time)}
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <p className="text-sm">Duration</p>
            </div>
            <p className="text-lg font-semibold">
              {formatDuration(streamData.scheduled_duration_seconds)}
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              <p className="text-sm">Enrollments</p>
            </div>
            <p className="text-lg font-semibold">
              {streamData.total_enrollments}
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Coins className="w-4 h-4" />
              <p className="text-sm">Revenue</p>
            </div>
            <p className="text-lg font-semibold text-amber-600">
              {streamData.total_enrollments * streamData.price_in_tokens} tokens
            </p>
          </div>
        </div>
      </div>

      {/* Recording Player - Show for ended streams with available recordings */}
      {streamData.status === "ended" &&
       streamData.recording_available &&
       streamData.recording_cloudflare_video_id && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <PlayCircle className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold">Recording Preview</h2>
          </div>
          <div className="mb-4">
            <CloudflareStreamPlayer
              playbackId={streamData.recording_cloudflare_video_id}
              autoplay={false}
              controls={true}
              poster={streamData.thumbnail_url || undefined}
            />
          </div>
          {streamData.recording_expires_at && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Recording available until{" "}
                {formatDate(streamData.recording_expires_at)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Section - Only show after stream ends */}
      {streamData.status === "ended" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-bold">Stream Analytics</h2>
          </div>
          <StreamAnalytics streamId={id} />
        </div>
      )}

      {/* Placeholder for live/scheduled streams */}
      {streamData.status !== "ended" && (
        <div className="bg-gray-50 rounded-lg border p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Analytics Coming Soon
          </h3>
          <p className="text-gray-600">
            Detailed analytics will be available after your stream ends. You'll
            see reaction data, engagement metrics, and technical issue reports
            here.
          </p>
        </div>
      )}
    </div>
  );
}
