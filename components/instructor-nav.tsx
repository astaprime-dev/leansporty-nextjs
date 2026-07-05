"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const INSTRUCTOR_NAV_LINKS = [
  { href: "/instructor", label: "Dashboard", exact: true },
  { href: "/instructor/streams", label: "Classes" },
  { href: "/instructor/programs", label: "Programs" },
  { href: "/instructor/comments", label: "Reviews" },
  { href: "/instructor/earnings", label: "Earnings" },
  { href: "/instructor/profile", label: "Profile" },
  { href: "/instructor/help", label: "Help" },
] as const;

export function isInstructorNavActive(
  pathname: string,
  link: { href: string; exact?: boolean }
) {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

/**
 * Studio desktop nav with an active-page indicator: a short bar under the
 * label, aligned to the header's bottom border (the -bottom offset spans the
 * header's py-4 padding + 1px border).
 */
export function InstructorNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-7">
      {INSTRUCTOR_NAV_LINKS.map((link) => {
        const active = isInstructorNavActive(pathname, link);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative py-3 -my-3 text-sm font-light transition-colors",
              active
                ? "text-gray-900 after:absolute after:inset-x-0 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-pink-500 after:to-rose-400"
                : "text-gray-600 hover:text-pink-500"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
