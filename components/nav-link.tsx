"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Top-nav link with an active/selected state. Active = brand pink (no weight
 * change, to keep the nav cluster balanced). Matches exact path or a nested
 * route (e.g. /streams active on /streams/[id]).
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName = "text-pink-600",
  inactiveClassName = "text-gray-600 hover:text-pink-500",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-colors duration-300",
        active ? activeClassName : inactiveClassName,
        className
      )}
    >
      {children}
    </Link>
  );
}
