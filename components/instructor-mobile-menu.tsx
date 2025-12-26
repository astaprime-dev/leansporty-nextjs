"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstructorMobileMenuProps {
  instructorSlug: string | null;
}

export function InstructorMobileMenu({
  instructorSlug,
}: InstructorMobileMenuProps) {
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
          <div className="fixed top-[73px] right-0 left-0 bg-white border-b border-pink-100 shadow-lg z-50 md:hidden">
            <div className="flex flex-col p-4 space-y-3">
              {/* Navigation Links */}
              <Link
                href="/instructor"
                className="text-base font-medium text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>

              <Link
                href="/instructor/streams"
                className="text-base font-medium text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                My Streams
              </Link>

              <Link
                href="/instructor/streams/create"
                className="text-base font-medium text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Create Stream
              </Link>

              <Link
                href="/instructor/profile"
                className="text-base font-medium text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>

              <Link
                href="/instructor/help"
                className="text-base font-medium text-gray-600 hover:text-pink-500 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Help
              </Link>

              {/* View Public Profile - only show if slug exists */}
              {instructorSlug && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <Link
                    href={`/@${instructorSlug}`}
                    target="_blank"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      View Public Profile
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
