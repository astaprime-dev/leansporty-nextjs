import { signInWithAppleAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Apple } from "lucide-react";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex-1 flex flex-col min-w-64 max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold mb-3 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
          Welcome to LeanSporty
        </h1>
        <p className="text-sm text-gray-600">
          Sign in with your Apple account to get started
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <SubmitButton
          formAction={signInWithAppleAction}
          pendingText="Connecting to Apple..."
          className="w-full bg-black hover:bg-gray-900 text-white font-medium flex items-center justify-center gap-3 h-12 rounded-lg transition-all"
        >
          <Apple className="w-5 h-5" />
          <span>Continue with Apple</span>
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>

      <div className="mt-6 p-4 bg-pink-50/50 border border-pink-100 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
