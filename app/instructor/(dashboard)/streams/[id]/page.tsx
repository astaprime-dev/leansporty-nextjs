import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LiveStreamSession } from "@/types/streaming";
import { StreamAnalytics } from "@/components/instructor/stream-analytics";
import { CloudflareStreamPlayer } from "@/components/CloudflareStreamPlayer";
import { CopyLinkButton } from "@/components/instructor/copy-link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Eye,
  Users,
  Edit,
  Radio,
  TrendingUp,
  ArrowLeft,
  PlayCircle,
} from "lucide-react";

export default async function StreamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; warn?: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { created, warn } = await searchParams;

  // Verify instructor access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/instructor/streams");
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

  // Class performance (S4.1). All server-side reads, scoped by RLS to the owning
  // instructor (roster / payouts / watch-sessions policies).
  const [{ count: enrolledCount }, { data: payoutRows }, { data: watchRows }] =
    await Promise.all([
      supabase
        .from("stream_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("stream_id", id),
      supabase
        .from("instructor_payouts")
        .select("gross_cents, instructor_share_cents, currency")
        .eq("stream_id", id),
      supabase
        .from("stream_watch_sessions")
        .select("total_watch_seconds")
        .eq("stream_id", id),
    ]);

  const sales = payoutRows?.length ?? 0;
  const grossCents = (payoutRows ?? []).reduce((s, r) => s + (r.gross_cents ?? 0), 0);
  const shareCents = (payoutRows ?? []).reduce((s, r) => s + (r.instructor_share_cents ?? 0), 0);
  const payoutCurrency = payoutRows?.[0]?.currency ?? "eur";
  const watchSeconds = (watchRows ?? []).reduce((s, r) => s + (r.total_watch_seconds ?? 0), 0);
  const isPaidClass = !!streamData.product_id;

  const fmtMoney = (cents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: payoutCurrency.toUpperCase(),
    }).format(cents / 100);

  const fmtWatch = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

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
              <h1 className="text-3xl sm:text-4xl font-display font-light text-gray-900">
                {streamData.title}
              </h1>
              <Badge
                variant={
                  streamData.status === "live"
                    ? "live"
                    : streamData.status === "scheduled"
                    ? "brand"
                    : "secondary"
                }
              >
                {streamData.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-600">{streamData.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {streamData.status === "scheduled" && (
              <Link href={`/instructor/streams/${id}/broadcast`}>
                <Button variant="brand">
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
            <Link href={`/instructor/streams/${id}/roster`}>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Roster
              </Button>
            </Link>
            {streamData.status === "scheduled" && (
              <Link href={`/instructor/streams/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stripe price provisioning failed on create — without this banner the
            instructor believes the class is priced when it's free (the create
            API returns the warning; the form forwards it as ?warn=price). */}
        {warn === "price" && (
          <Alert variant="warning" className="mb-4">
            <p className="font-semibold">Your class is live, but the price didn&apos;t stick</p>
            <p className="text-sm">
              The class was created, but pricing couldn&apos;t be set up — right
              now it&apos;s free to join. Open Edit and set the price again.
            </p>
          </Alert>
        )}

        {/* Share — for classes that haven't ended */}
        {streamData.status !== "ended" && streamData.status !== "cancelled" && (
          <Alert variant={created ? "success" : "info"} className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {created ? "Your class is scheduled" : "Share your class"}
                </p>
                <p className="text-sm">
                  Share this link so students can find and join your class.
                </p>
              </div>
              <CopyLinkButton
                path={`/streams/${id}`}
                variant="brandOutline"
                className="shrink-0"
              />
            </div>
          </Alert>
        )}

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
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Eye className="w-4 h-4" />
              <p className="text-sm">Peak Viewers</p>
            </div>
            <p className="text-lg font-semibold">
              {streamData.max_viewers}
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
            <h2 className="text-2xl font-semibold">Recording Preview</h2>
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
            <Alert variant="warning">
              Recording available until{" "}
              {formatDate(streamData.recording_expires_at)}
            </Alert>
          )}
        </div>
      )}

      {/* Class performance — real numbers, for every status */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-semibold">Class performance</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
            <p className="text-sm text-gray-600">
              {isPaidClass ? "Sales" : "Enrolled"}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {isPaidClass ? sales : enrolledCount ?? 0}
            </p>
          </div>
          {isPaidClass ? (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
              <p className="text-sm text-gray-600">Your earnings</p>
              <p className="text-2xl font-bold text-gray-900">{fmtMoney(shareCents)}</p>
              <p className="text-xs text-gray-500 mt-1">{fmtMoney(grossCents)} gross</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-2xl font-bold text-green-600">Free</p>
            </div>
          )}
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
            <p className="text-sm text-gray-600">Peak viewers</p>
            <p className="text-2xl font-bold text-gray-900">{streamData.max_viewers}</p>
          </div>
          <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
            <p className="text-sm text-gray-600">Watch time</p>
            <p className="text-2xl font-bold text-gray-900">{fmtWatch(watchSeconds)}</p>
          </div>
        </div>
        {streamData.status === "scheduled" && (
          <p className="mt-4 text-sm text-muted-foreground">
            Viewers and watch time populate once your class goes live.
          </p>
        )}
      </div>

      {/* Reaction analytics — after the class ends */}
      {streamData.status === "ended" && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            <h2 className="text-2xl font-semibold">Reactions &amp; feedback</h2>
          </div>
          <StreamAnalytics streamId={id} />
        </div>
      )}
    </div>
  );
}
