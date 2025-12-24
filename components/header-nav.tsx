import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HeaderNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only show navigation for authenticated users
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-6">
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
      {/* Uncomment when streams page is ready */}
      {/* <Link
        href="/streams"
        className="text-sm font-light text-gray-600 hover:text-pink-500 transition-colors duration-300"
      >
        Streams
      </Link> */}
    </div>
  );
}
