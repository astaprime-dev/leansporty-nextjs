import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Sign in · Lean Sporty",
};

/**
 * Canonical /sign-in page — a real, trackable URL for direct/returning logins,
 * email & campaign links, and the destination for logged-out redirects (replaces
 * the dead /sign-in + /login redirects). The in-funnel modal stays primary; this
 * renders the same <AuthForm> so the two surfaces are identical.
 *
 * `?redirect=/path` (or `?next=`) resumes intent after auth; only same-site paths
 * are honored. Already-signed-in visitors are bounced to their program.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.redirect ?? sp.next;
  const next = typeof raw === "string" && raw.startsWith("/") ? raw : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next ?? "/my-program");
  }

  return (
    <div className="flex-1 w-full flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-pink-100 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="font-display text-3xl sm:text-4xl font-light text-gray-900 text-center">
            Welcome to Lean Sporty
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Sign in or create your account to access your program and track your
            progress.
          </p>
          <div className="mt-6">
            <AuthForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
