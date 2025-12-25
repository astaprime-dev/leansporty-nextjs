import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { LiveStreamSession } from "@/types/streaming";
import { Plus, Calendar, Users, DollarSign, Eye } from "lucide-react";
import { redirect } from "next/navigation";

export default async function InstructorDashboard() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/instructor/login");
  }

  // Check if instructor profile exists
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!instructorProfile) {
    redirect("/instructor/profile");
  }

  // Fetch stream statistics
  const { data: allStreams } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("instructor_id", instructorProfile.id);

  const streamsList = (allStreams || []) as LiveStreamSession[];

  const stats = {
    total: streamsList.length,
    live: streamsList.filter(s => s.status === "live").length,
    scheduled: streamsList.filter(s => s.status === "scheduled").length,
    ended: streamsList.filter(s => s.status === "ended").length,
    totalEnrollments: streamsList.reduce((sum, s) => sum + (s.total_enrollments || 0), 0),
    totalTokens: streamsList.reduce((sum, s) => sum + (s.total_enrollments || 0) * s.price_in_tokens, 0),
  };

  // Fetch upcoming streams (next 3)
  const { data: upcomingStreams } = await supabase
    .from("live_stream_sessions")
    .select("*")
    .eq("instructor_id", instructorProfile.id)
    .in("status", ["scheduled", "live"])
    .gte("scheduled_start_time", new Date().toISOString())
    .order("scheduled_start_time", { ascending: true })
    .limit(3);

  const upcomingList = (upcomingStreams || []) as LiveStreamSession[];

  // Fetch recent enrollments (we'll need to join with stream_enrollments table)
  const { data: recentEnrollments } = await supabase
    .from("stream_enrollments")
    .select(`
      *,
      live_stream_sessions!inner (
        title,
        instructor_id
      ),
      user_profiles (
        display_name,
        username
      )
    `)
    .eq("live_stream_sessions.instructor_id", instructorProfile.id)
    .order("enrolled_at", { ascending: false })
    .limit(5);

  // Check profile completion
  const profileCompletion = {
    hasPhoto: !!instructorProfile.profile_photo_url,
    hasBio: !!instructorProfile.bio,
    hasSocial: !!(instructorProfile.instagram_handle || instructorProfile.website_url),
  };
  const completionPercentage = Math.round(
    ((profileCompletion.hasPhoto ? 1 : 0) +
     (profileCompletion.hasBio ? 1 : 0) +
     (profileCompletion.hasSocial ? 1 : 0)) / 3 * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {instructorProfile.display_name}
        </h1>
        <p className="text-gray-600">Here's what's happening with your streams</p>
      </div>

      {/* Profile Completion Alert */}
      {completionPercentage < 100 && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Complete your profile ({completionPercentage}%)
              </h3>
              <p className="text-sm text-yellow-700">
                {!profileCompletion.hasPhoto && "Add a profile photo. "}
                {!profileCompletion.hasBio && "Write a bio. "}
                {!profileCompletion.hasSocial && "Add social links."}
              </p>
            </div>
            <Link href="/instructor/profile">
              <Button variant="outline" size="sm">
                Complete Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link href="/instructor/streams/create">
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-lg p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <Plus className="w-8 h-8 mb-2" />
            <h3 className="text-xl font-semibold mb-1">Create New Stream</h3>
            <p className="text-pink-50 text-sm">Schedule your next live class</p>
          </div>
        </Link>
        <Link href={`/@${instructorProfile.slug}`} target="_blank">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Eye className="w-8 h-8 mb-2 text-gray-600" />
            <h3 className="text-xl font-semibold mb-1 text-gray-900">View Public Profile</h3>
            <p className="text-gray-600 text-sm">See how others see your profile</p>
          </div>
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.scheduled}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Scheduled</h3>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-2xl font-bold text-gray-900">{stats.live}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Live Now</h3>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Enrollments</h3>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalTokens}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Tokens Earned</h3>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Upcoming Streams */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Streams</h2>
            <Link href="/instructor/streams">
              <Button variant="ghost" size="sm">
                View All →
              </Button>
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No upcoming streams</p>
              <Link href="/instructor/streams/create">
                <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-400">
                  Schedule One
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingList.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/instructor/streams/${stream.id}/broadcast`}
                  className="block"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-pink-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {stream.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {new Date(stream.scheduled_start_time).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>💰 {stream.price_in_tokens} tokens</span>
                          <span>👥 {stream.total_enrollments} enrolled</span>
                        </div>
                      </div>
                      {stream.status === "live" && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Enrollments</h2>

          {!recentEnrollments || recentEnrollments.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No enrollments yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y">
              {recentEnrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {enrollment.user_profiles?.display_name || "User"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {enrollment.live_stream_sessions.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
