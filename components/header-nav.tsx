import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HeaderNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is an instructor
  let isInstructor = false;
  if (user) {
    const { data: instructorProfile } = await supabase
      .from("instructors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    isInstructor = !!instructorProfile;
  }

  return (
    <div className="flex items-center gap-6">
      {/* Streams - visible to everyone for discovery */}
      <Link
        href="/streams"
        className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
      >
        Streams
      </Link>

      {/* Workouts - visible to everyone */}
      <Link
        href="/workouts"
        className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
      >
        Workouts
      </Link>

      {/* Authenticated user links */}
      {user && (
        <Link
          href="/activity"
          className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
        >
          Activity
        </Link>
      )}

      {/* Instructor links - only visible to instructors */}
      {isInstructor && (
        <>
          <Link
            href="/instructor"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            Dashboard
          </Link>
          <Link
            href="/instructor/streams"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            My Streams
          </Link>
          <Link
            href="/instructor/streams/create"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            Create Stream
          </Link>
          <Link
            href="/instructor/profile"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            My Profile
          </Link>
        </>
      )}
    </div>
  );
}
