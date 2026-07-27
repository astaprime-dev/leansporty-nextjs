import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { InstructorMobileMenu } from "@/components/instructor-mobile-menu";
import { InstructorNav } from "@/components/instructor-nav";

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
    redirect("/sign-in?redirect=/instructor");
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
    <div className="min-h-screen bg-pink-50/20">
      {/* Instructor Header */}
      <header className="bg-white/90 border-b border-pink-100 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/instructor">
              <h1 className="text-lg font-display font-light text-gray-900">
                Instructor Studio
              </h1>
            </Link>
            <InstructorNav />
          </div>

          <div className="flex items-center gap-4">
            {instructorProfile.slug && (
              <Link href={`/@${instructorProfile.slug}`} target="_blank">
                <Button variant="brandOutline" size="sm" className="hidden sm:inline-flex rounded-full">
                  View Public Profile
                </Button>
              </Link>
            )}
            <InstructorMobileMenu instructorSlug={instructorProfile.slug} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
