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
                width="18"
                height="22"
                viewBox="0 0 18 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M17.7676 16.7871C17.4043 17.6758 16.9707 18.5039 16.4668 19.2715C15.7734 20.3027 15.1953 21.0293 14.7383 21.4512C14.0371 22.1191 13.2852 22.4609 12.4785 22.4805C11.9043 22.4805 11.2109 22.3164 10.4043 21.9824C9.59375 21.6504 8.84766 21.4863 8.16406 21.4863C7.44531 21.4863 6.67969 21.6504 5.86719 21.9824C5.05273 22.3164 4.39258 22.4902 3.88477 22.5078C3.11328 22.541 2.34375 22.1895 1.57617 21.4512C1.08398 20.9941 0.480469 20.2402 -0.228516 19.1895C-0.986328 18.0781 -1.5957 16.7871 -2.05664 15.3145C-2.55078 13.6855 -2.79785 12.1074 -2.79785 10.5781C-2.79785 8.81641 -2.45117 7.31445 -1.75977 6.07422C-1.20117 5.04688 -0.447266 4.23438 0.5 3.63867C1.44727 3.04297 2.47656 2.73828 3.58984 2.71875C4.19922 2.71875 4.99609 2.90625 5.98438 3.27344C6.96875 3.64258 7.61328 3.83008 7.91602 3.83008C8.14648 3.83008 8.85352 3.61328 10.0312 3.18164C11.1504 2.78125 12.0918 2.61328 12.8594 2.66992C14.9473 2.81055 16.5176 3.60742 17.5625 5.06641C15.709 6.18945 14.791 7.73242 14.8086 9.69141C14.8262 11.2422 15.3848 12.541 16.4805 13.584C16.9707 14.0742 17.5156 14.4551 18.123 14.7285C17.9961 15.0957 17.8867 15.4473 17.7676 15.7871M12.9863 -2.20703C12.9863 -1.00977 12.5527 0.107422 11.6895 1.125C10.6445 2.33203 9.37695 3.03125 8.00195 2.91797C7.98438 2.76953 7.97461 2.61328 7.97461 2.44922C7.97461 1.2793 8.46875 0.0644531 9.34961 0.0683594C9.78516 0.0683594 10.3066 0.175781 10.9141 0.390625C11.5195 0.603516 12.0078 0.816406 12.377 1.02734C12.7461 1.24023 13.041 1.4082 13.2598 1.53125L12.9863 -2.20703Z"
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
