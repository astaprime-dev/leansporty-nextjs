import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated with Supabase first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in as regular user - redirect to instructor login
    redirect("/instructor/login");
  }

  // Check if instructor profile exists (this is the real authorization check)
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no instructor profile exists, check if they have a valid invite token
  if (!instructorProfile) {
    const cookieStore = await cookies();
    const instructorToken = cookieStore.get("instructor_token");

    // If they don't have the invite token, redirect to login
    if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
      redirect("/instructor/login");
    }

    // They have the invite token but no profile - allow access to create it
    // Individual pages will handle requiring the profile if needed
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instructor Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/instructor">
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                Instructor Dashboard
              </h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/instructor"
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/instructor/streams"
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
              >
                My Streams
              </Link>
              <Link
                href="/instructor/streams/create"
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
              >
                Create Stream
              </Link>
              <Link
                href="/instructor/profile"
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
              >
                My Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                View Site
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
