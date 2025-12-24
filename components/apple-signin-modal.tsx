"use client";

import { signInWithAppleAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AppleSignInModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            Welcome to LeanSporty
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Sign in with your Apple account to access your workouts and track your progress
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <form>
            <SubmitButton
              formAction={signInWithAppleAction}
              pendingText="Connecting to Apple..."
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-3"
            >
              {/* Official Apple Logo SVG */}
              <svg
                width="20"
                height="24"
                viewBox="0 0 814 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
                  fill="currentColor"
                />
              </svg>
              <span className="font-semibold">Sign in with Apple</span>
            </SubmitButton>
          </form>

          <div className="mt-2 p-3 bg-pink-50/50 border border-pink-100 rounded-lg">
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
