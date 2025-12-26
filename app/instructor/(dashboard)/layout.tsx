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
    // Not logged in as regular user - redirect to main login with return URL
    redirect("/?redirect=/instructor/activate");
  }

  // Check if instructor profile exists
  // Profile creation happens automatically during activation
  const { data: instructorProfile } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If no instructor profile exists, redirect to activation page
  if (!instructorProfile) {
    redirect("/instructor/activate");
  }

  // Profile exists - user is activated and can access instructor dashboard
  // Individual pages may redirect to profile page if profile needs completion

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
              <Link
                href="/instructor/help"
                className="text-sm font-medium text-gray-600 hover:text-pink-500 transition-colors"
              >
                Help
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/@${instructorProfile.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                View Public Profile
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
