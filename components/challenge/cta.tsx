"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OAuthSignInModal } from "@/components/oauth-signin-modal";

async function createCheckout(productSlug: string) {
  const res = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productSlug }),
  });
  return (await res.json().catch(() => ({}))) as {
    url?: string;
    alreadyOwned?: boolean;
  };
}

interface CheckoutButtonProps {
  productSlug: string;
  isAuthenticated: boolean;
  owned: boolean;
  /** Where to return after sign-in (anonymous users). */
  next: string;
  label: string;
  ownedLabel?: string;
  className?: string;
}

/**
 * Primary "Start the Challenge" CTA.
 * - owned → go to My Program
 * - signed in → create Stripe Checkout, redirect to it
 * - anonymous → open the auth modal; after sign-in the `next` URL resumes checkout
 */
export function CheckoutButton({
  productSlug,
  isAuthenticated,
  owned,
  next,
  label,
  ownedLabel = "Go to your program",
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const data = await createCheckout(productSlug);
      if (data.alreadyOwned) {
        router.push("/my-program");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("We couldn't start checkout. Please try again.");
    } catch {
      setError("We couldn't start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (owned) {
    return (
      <Button className={className} onClick={() => router.push("/my-program")}>
        {ownedLabel}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <OAuthSignInModal next={next}>
        <Button className={className}>{label}</Button>
      </OAuthSignInModal>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button className={className} onClick={startCheckout} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting checkout…
          </>
        ) : (
          label
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Secondary "Try Day 1 free" CTA → My Program (Day 1 plays via preview gate).
 * Anonymous users sign in first, then resume into My Program.
 */
export function PreviewButton({
  isAuthenticated,
  label,
  className,
}: {
  isAuthenticated: boolean;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => router.push("/my-program")}
      >
        {label}
      </Button>
    );
  }
  return (
    <OAuthSignInModal next="/my-program">
      <Button variant="outline" className={className}>
        {label}
      </Button>
    </OAuthSignInModal>
  );
}

/**
 * Intent resume (UX-FR-2): when an anonymous user clicked "Start the Challenge",
 * signed in, and returned to /challenge?intent=checkout, auto-open Checkout.
 * `active` is derived from server searchParams (no client useSearchParams needed).
 */
export function ChallengeAutoCheckout({
  active,
  productSlug,
  isAuthenticated,
  owned,
}: {
  active: boolean;
  productSlug: string;
  isAuthenticated: boolean;
  owned: boolean;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (!active || fired.current || !isAuthenticated) return;
    fired.current = true;
    if (owned) {
      window.location.href = "/my-program";
      return;
    }
    (async () => {
      const data = await createCheckout(productSlug);
      if (data.alreadyOwned) window.location.href = "/my-program";
      else if (data.url) window.location.href = data.url;
    })();
  }, [active, productSlug, isAuthenticated, owned]);
  return null;
}

/**
 * Post-checkout "finalizing access" (UX-FR-1): the Stripe webhook grants the
 * entitlement asynchronously, so poll status until it lands, then refresh the
 * server component so the grid unlocks — the buyer never sees a paywall.
 */
export function FinalizingAccess({ slug }: { slug: string }) {
  const router = useRouter();
  const [stillWaiting, setStillWaiting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const tick = async () => {
      tries += 1;
      try {
        const res = await fetch(
          `/api/entitlements/status?slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json().catch(() => ({}));
        if (data.owned) {
          if (!cancelled) {
            setStillWaiting(false);
            router.refresh();
          }
          return;
        }
      } catch {
        /* keep polling */
      }
      if (tries < 20 && !cancelled) setTimeout(tick, 2000);
      else if (!cancelled) setStillWaiting(false);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (!stillWaiting) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-800">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Finalizing your access — your sessions will unlock in a moment…</span>
    </div>
  );
}
