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

  // Check if user has valid instructor token
  const cookieStore = await cookies();
  const instructorToken = cookieStore.get("instructor_token");

  if (instructorToken?.value !== process.env.INSTRUCTOR_ACCESS_TOKEN) {
    redirect("/instructor/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instructor Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/instructor/streams">
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                Instructor Dashboard
              </h1>
            </Link>
            <nav className="flex items-center gap-4">
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
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                View Site
              </Button>
            </Link>
            <form action="/api/instructor/login" method="DELETE">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-red-500"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
