"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface MobileMenuProps {
  user: User | null;
  isInstructor: boolean;
}

export function MobileMenu({ user, isInstructor }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-64 bg-white border-l border-pink-100 shadow-lg z-[60] md:hidden">
            <div className="flex flex-col p-4 space-y-4">
              {/* Navigation Links */}
              <Link
                href="/streams"
                className="text-base font-light text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Streams
              </Link>

              <Link
                href="/workouts"
                className="text-base font-light text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Workouts
              </Link>

              {user && (
                <Link
                  href="/activity"
                  className="text-base font-light text-gray-600 hover:text-pink-500 transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Activity
                </Link>
              )}

              {isInstructor && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <Link
                    href="/instructor"
                    className="text-base font-semibold text-gray-900 hover:text-pink-500 transition-colors py-2"
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
                <span className="text-xs">✧</span>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
