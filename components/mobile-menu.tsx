"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface MobileMenuProps {
  user: User | null;
  isInstructor: boolean;
}

export function MobileMenu({ user, isInstructor }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navCls = (href: string) =>
    `text-base font-light transition-colors py-2 ${
      pathname === href || pathname.startsWith(href + "/")
        ? "text-pink-600"
        : "text-gray-600 hover:text-pink-500"
    }`;

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
                <Link
                  href="/challenge"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Start the Challenge</span>
                </Link>
              )}

              {/* Challenge - first for prominence; the pink CTA carries the emphasis */}
              <Link
                href="/challenge"
                className={navCls("/challenge")}
                onClick={() => setIsOpen(false)}
              >
                Challenge
              </Link>

              <Link
                href="/streams"
                className={navCls("/streams")}
                onClick={() => setIsOpen(false)}
              >
                Streams
              </Link>

              {user && (
                <>
                  <Link
                    href="/my-program"
                    className={navCls("/my-program")}
                    onClick={() => setIsOpen(false)}
                  >
                    My Program
                  </Link>
                  <Link
                    href="/workouts"
                    className={navCls("/workouts")}
                    onClick={() => setIsOpen(false)}
                  >
                    Workouts
                  </Link>
                  <Link
                    href="/activity"
                    className={navCls("/activity")}
                    onClick={() => setIsOpen(false)}
                  >
                    Activity
                  </Link>
                </>
              )}

              {isInstructor && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <Link
                    href="/instructor"
                    className={navCls("/instructor")}
                    onClick={() => setIsOpen(false)}
                  >
                    Instructor Studio
                  </Link>
                </>
              )}

              {/* Download App CTA */}
              <div className="border-t border-pink-100 my-2" />
              <a
                href="https://apps.apple.com/app/id6745218800"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-sm font-light rounded-full hover:shadow-lg transition-all"
                onClick={() => setIsOpen(false)}
              >
                <span>Download App</span>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
