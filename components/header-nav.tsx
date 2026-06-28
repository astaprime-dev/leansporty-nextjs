import { createClient } from "@/utils/supabase/server";
import { NavLink } from "@/components/nav-link";

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
    <div className="hidden md:flex items-center gap-3 lg:gap-6">
      {user ? (
        <>
          {/* Signed in → lead with the buyer's program */}
          <NavLink href="/my-program" className="text-sm font-light">
            My Program
          </NavLink>
          <NavLink href="/activity" className="text-sm font-light">
            Activity
          </NavLink>
          <NavLink href="/streams" className="text-sm font-light">
            Streams
          </NavLink>
        </>
      ) : (
        <>
          {/* Anonymous → lead with the offer */}
          <NavLink href="/challenge" className="text-sm font-light">
            Challenge
          </NavLink>
          <NavLink href="/streams" className="text-sm font-light">
            Streams
          </NavLink>
        </>
      )}

      {/* Instructor dashboard link - only visible to instructors */}
      {isInstructor && (
        <NavLink
          href="/instructor"
          className="text-sm font-light whitespace-nowrap"
        >
          Instructor Studio
        </NavLink>
      )}
    </div>
  );
}
