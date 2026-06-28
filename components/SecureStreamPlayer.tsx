"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SecureStreamPlayerProps {
  /** The workout (content) id — passed to `get_playable_uid` via the token route. */
  contentId: string;
  className?: string;
  /**
   * Optional custom paywall rendered on a 403 (not entitled). Defaults to a
   * generic "unlock" CTA. Product surfaces (e.g. the challenge) pass their own.
   */
  renderPaywall?: () => React.ReactNode;
  /** Where the default paywall CTA links (e.g. the product landing page). */
  paywallHref?: string;
}

/**
 * Plays a Cloudflare Stream asset through the secure pipeline: it requests a
 * short-lived signed token from `/api/playback/token` (which enforces the
 * entitlement gate server-side), renders the Cloudflare iframe for the signed
 * URL, and overlays the viewer's email as a per-user watermark (deterrent +
 * leak tracer). A 403 means "not entitled" → show the paywall.
 *
 * The same component serves free previews and owned content — the gate lives
 * entirely on the server. E1.3 / SECURE_PLAYBACK_SPEC §6.
 */
export function SecureStreamPlayer({
  contentId,
  className = "",
  renderPaywall,
  paywallHref = "/",
}: SecureStreamPlayerProps) {
  const [src, setSrc] = useState("");
  const [mark, setMark] = useState("");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let off = false;
    setSrc("");
    setDenied(false);
    (async () => {
      const res = await fetch("/api/playback/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentId }),
      }); // same-origin → Supabase cookie sent automatically
      if (!res.ok) {
        if (!off) setDenied(true);
        return;
      }
      const { iframe, watermark } = await res.json();
      if (!off) {
        setSrc(`${iframe}?controls=true`);
        setMark(watermark ?? "");
      }
    })();
    return () => {
      off = true;
    };
  }, [contentId]);

  if (denied) {
    if (renderPaywall) return <>{renderPaywall()}</>;
    return (
      <div
        className={cn(
          "flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border bg-muted text-center",
          className
        )}
      >
        <Lock className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This session is locked.
        </p>
        <Button asChild size="sm">
          <Link href={paywallHref}>Unlock to watch</Link>
        </Button>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={cn("aspect-video w-full animate-pulse rounded-lg bg-muted", className)} />
    );
  }

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        src={src}
        className="absolute inset-0 h-full w-full rounded-lg"
        style={{ border: 0 }}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      {/* per-user watermark — deterrent + leak tracing */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-3">
        <span className="select-none text-[11px] text-white/30">{mark}</span>
      </div>
    </div>
  );
}
