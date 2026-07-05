"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INSTRUCTOR_NAV_LINKS,
  isInstructorNavActive,
} from "@/components/instructor-nav";

interface InstructorMobileMenuProps {
  instructorSlug: string | null;
}

export function InstructorMobileMenu({
  instructorSlug,
}: InstructorMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          <div className="fixed top-[73px] right-0 left-0 bg-white border-b border-pink-100 shadow-lg z-[60] md:hidden">
            <div className="flex flex-col p-4 space-y-3">
              {INSTRUCTOR_NAV_LINKS.map((link) => {
                const active = isInstructorNavActive(pathname, link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-base font-light transition-colors py-2",
                      active
                        ? "text-pink-500 font-normal border-l-2 border-pink-500 pl-3 -ml-1"
                        : "text-gray-600 hover:text-pink-500"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* View Public Profile - only show if slug exists */}
              {instructorSlug && (
                <>
                  <div className="border-t border-pink-100 my-2" />
                  <Link
                    href={`/@${instructorSlug}`}
                    target="_blank"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="w-full">
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
