import { User } from "@supabase/supabase-js";
import { NavLink } from "@/components/nav-link";

interface HeaderNavProps {
  user: User | null;
  isInstructor: boolean;
  /** Show the Classes link only when live classes actually exist. */
  showClasses: boolean;
}

/**
 * Desktop top-nav. Active underline uses the same geometry as the Studio
 * sub-nav (components/instructor-nav.tsx): py-3 hit area, bar just past its
 * bottom edge — so both bars show the line at the same distance below the
 * text.
 */
const LINK = "relative py-3 -my-3 text-sm font-light";
const ACTIVE =
  "text-gray-900 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-pink-500 after:to-rose-400";

export default function HeaderNav({ user, isInstructor, showClasses }: HeaderNavProps) {
  return (
    <div className="hidden md:flex items-center gap-3 lg:gap-6">
      {user ? (
        <>
          {/* Signed in → lead with the buyer's training */}
          <NavLink href="/my-program" className={LINK} activeClassName={ACTIVE}>
            My Training
          </NavLink>
          <NavLink href="/activity" className={LINK} activeClassName={ACTIVE}>
            Activity
          </NavLink>
          {showClasses && (
            <NavLink href="/streams" className={LINK} activeClassName={ACTIVE}>
              Classes
            </NavLink>
          )}
        </>
      ) : (
        <>
          {/* Anonymous → lead with the offer */}
          <NavLink href="/challenge" className={LINK} activeClassName={ACTIVE}>
            Challenge
          </NavLink>
          {showClasses && (
            <NavLink href="/streams" className={LINK} activeClassName={ACTIVE}>
              Classes
            </NavLink>
          )}
          {/* /teach is reached via direct outreach links + the footer — keeping
              it out of the buyer-facing nav keeps the funnel clean. */}
        </>
      )}

      {/* Instructor dashboard link - only visible to instructors */}
      {isInstructor && (
        <NavLink
          href="/instructor"
          className={`${LINK} whitespace-nowrap`}
          activeClassName={ACTIVE}
        >
          Instructor Studio
        </NavLink>
      )}
    </div>
  );
}
