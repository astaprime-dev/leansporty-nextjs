import { User } from "@supabase/supabase-js";
import { NavLink } from "@/components/nav-link";

interface HeaderNavProps {
  user: User | null;
  isInstructor: boolean;
}

export default function HeaderNav({ user, isInstructor }: HeaderNavProps) {
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
          <NavLink href="/teach" className="text-sm font-light">
            Teach
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
