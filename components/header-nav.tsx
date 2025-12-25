import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HeaderNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center gap-6">
      {/* Streams - visible to everyone for discovery */}
      <Link
        href="/streams"
        className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
      >
        Streams
      </Link>

      {/* Authenticated user links */}
      {user && (
        <>
          <Link
            href="/activity"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            Activity
          </Link>
          <Link
            href="/workouts"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            Workouts
          </Link>
          <Link
            href="/settings"
            className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
          >
            Settings
          </Link>
        </>
      )}
    </div>
  );
}
