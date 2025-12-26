import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStreams, getUserEnrollments } from "@/app/actions";
import { StreamCard } from "@/components/stream-card";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  // Require @ prefix - show 404 if missing
  if (!username.startsWith('@')) {
    notFound();
  }

  // Remove @ prefix for database lookup
  const slug = username.slice(1);

  const supabase = await createClient();

  // Check if it's an instructor profile first
  const { data: instructor } = await supabase
    .from("instructors")
    .select("*")
    .eq("slug", slug)
    .single();

  // If not an instructor, check user profiles
  const { data: userProfile } = !instructor
    ? await supabase
        .from("user_profiles")
        .select("*")
        .eq("username", slug)
        .single()
    : { data: null };

  // If neither exists, show 404
  if (!instructor && !userProfile) {
    notFound();
  }

  const isInstructor = !!instructor;
  const profile = instructor || userProfile;

  // Check if current user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user enrollments to show past scheduled streams if enrolled
  const enrollments = await getUserEnrollments();
  const enrolledStreamIds = enrollments.map(e => e.stream_id);

  // Fetch streams using shared business logic
  // If instructor profile: shows ALL their scheduled/live streams
  // Otherwise: shows future scheduled + enrolled past scheduled
  const streams = isInstructor
    ? await getStreams({ enrolledStreamIds, instructorId: instructor.id })
    : { liveStreams: [], upcomingStreams: [] };

  const upcomingStreams = [...streams.liveStreams, ...streams.upcomingStreams];

  // Create enrollment map for StreamCard
  const enrollmentMap = new Map(enrollments.map((e) => [e.stream_id, e]));

  // Get instructor's past streams (for reference/portfolio)
  const { data: pastStreams } = isInstructor
    ? await supabase
        .from("live_stream_sessions")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("status", "ended")
        .order("scheduled_start_time", { ascending: false })
        .limit(6)
    : { data: null };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`min-h-screen ${isInstructor
      ? 'bg-gradient-to-b from-pink-100/40 via-rose-50/30 to-white'
      : 'bg-gradient-to-b from-pink-50/30 to-white'}`}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className={`bg-white rounded-2xl border shadow-sm p-8 mb-8 ${isInstructor
          ? 'border-pink-200 shadow-pink-100/50 shadow-lg relative overflow-hidden'
          : 'border-pink-100'}`}>
          {/* Premium glow effect for instructors */}
          {isInstructor && (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-transparent to-rose-50/60 pointer-events-none" />
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
            {/* Profile Photo with gradient ring for instructors */}
            <div className={isInstructor ? 'relative p-1 rounded-full bg-gradient-to-br from-pink-500 via-rose-400 to-pink-500 animate-pulse' : ''}>
              <Avatar className={`h-32 w-32 ${isInstructor ? 'ring-4 ring-white' : ''}`}>
                {profile.profile_photo_url && (
                  <AvatarImage
                    src={profile.profile_photo_url}
                    alt={profile.display_name}
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-4xl font-medium">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                  {profile.display_name}
                </h1>
                {isInstructor && (
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-semibold rounded-full">
                    INSTRUCTOR
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-3">@{isInstructor ? instructor.slug : userProfile.username}</p>

              {profile.bio && (
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}

              {/* Location and Birthday for user profiles */}
              {!isInstructor && (
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  {userProfile.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{userProfile.location}</span>
                    </span>
                  )}
                  {userProfile.birthday && (
                    <span className="flex items-center gap-1">
                      <span>🎂</span>
                      <span>{new Date(userProfile.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-4 text-sm">
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1"
                  >
                    <span>📷</span>
                    <span>@{profile.instagram_handle}</span>
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1"
                  >
                    <span>🌐</span>
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Streams (Instructors only) */}
        {isInstructor && upcomingStreams && upcomingStreams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Upcoming Streams
            </h2>
            <div className="grid gap-6">
              {upcomingStreams.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  enrollment={enrollmentMap.get(stream.id)}
                  isLive={stream.status === "live"}
                  isAuthenticated={!!user}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Upcoming Streams Message (Instructors only) */}
        {isInstructor && (!upcomingStreams || upcomingStreams.length === 0) && (
          <div className="bg-pink-50/50 rounded-xl border border-pink-100 p-8 text-center mb-8">
            <p className="text-gray-600">
              No upcoming streams scheduled at the moment. Check back soon!
            </p>
          </div>
        )}

        {/* Past Streams (Instructors only) */}
        {isInstructor && pastStreams && pastStreams.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Past Classes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pastStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {stream.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {formatDate(stream.scheduled_start_time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
