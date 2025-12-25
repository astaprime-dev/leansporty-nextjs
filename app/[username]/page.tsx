import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  // Remove @ prefix if present (for /@username URLs)
  const slug = username.startsWith('@') ? username.slice(1) : username;

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

  // Only fetch streams if this is an instructor profile
  const { data: upcomingStreams } = isInstructor
    ? await supabase
        .from("live_stream_sessions")
        .select("*")
        .eq("instructor_id", instructor.id)
        .in("status", ["scheduled", "live"])
        .gte("scheduled_start_time", new Date().toISOString())
        .order("scheduled_start_time", { ascending: true })
    : { data: null };

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Profile Photo */}
            <Avatar className="h-32 w-32">
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
            <div className="grid gap-4">
              {upcomingStreams.map((stream) => (
                <Link
                  key={stream.id}
                  href={`/streams/${stream.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-md transition-all p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-pink-500 transition-colors mb-2">
                          {stream.title}
                        </h3>
                        {stream.description && (
                          <p className="text-gray-600 mb-3">{stream.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {formatDate(stream.scheduled_start_time)}</span>
                          <span>⏱️ {formatDuration(stream.scheduled_duration_seconds)}</span>
                          {stream.price_in_tokens > 0 && (
                            <span className="text-pink-500 font-medium">
                              {stream.price_in_tokens} tokens
                            </span>
                          )}
                        </div>
                      </div>
                      {stream.status === "live" && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
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
