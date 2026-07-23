"use client";

import { useState } from "react";
import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { X, Menu } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface MobileMenuProps {
  user: User | null;
  isInstructor: boolean;
  /** Show the Classes link only when live classes actually exist. */
  showClasses: boolean;
  /** Deep link to the free Day 1 watch page (falls back to /challenge). */
  freeDayHref: string;
}

export function MobileMenu({ user, isInstructor, showClasses, freeDayHref }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-600 hover:text-pink-500 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-64 bg-white border-l border-pink-100 shadow-lg z-[60] md:hidden">
            <div className="flex flex-col p-4 space-y-4">
              {/* Anonymous primary CTA — drive to the web offer */}
              {!user && (
                <Button asChild variant="brand" className="w-full gap-2">
                  <Link href="/challenge" onClick={close}>
                    <span>Start the Challenge</span>
                  </Link>
                </Button>
              )}

              {user ? (
                <>
                  {/* Signed in → lead with the program */}
                  <NavLink href="/my-program" onClick={close} className="text-base font-light py-2">
                    My Training
                  </NavLink>
                  <NavLink href="/activity" onClick={close} className="text-base font-light py-2">
                    Activity
                  </NavLink>
                  {showClasses && (
                    <NavLink href="/streams" onClick={close} className="text-base font-light py-2">
                      Classes
                    </NavLink>
                  )}
                </>
              ) : (
                <>
                  <NavLink href="/challenge" onClick={close} className="text-base font-light py-2">
                    Challenge
                  </NavLink>
                  <NavLink href={freeDayHref} onClick={close} className="text-base font-light py-2">
                    Free Day 1
                  </NavLink>
                  {showClasses && (
                    <NavLink href="/streams" onClick={close} className="text-base font-light py-2">
                      Classes
                    </NavLink>
                  )}
                </>
              )}

              {isInstructor && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <NavLink href="/instructor" onClick={close} className="text-base font-light py-2">
                    Instructor Studio
                  </NavLink>
                </>
              )}

              {/* Download App CTA — hidden for instructors (creators, not app users) */}
              {!isInstructor && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <Button asChild variant="brand" className="w-full gap-2">
                    <a
                      href="https://apps.apple.com/app/id6745218800"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                    >
                      <span>Download App</span>
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
