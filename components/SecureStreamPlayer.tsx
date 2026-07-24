"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Resume playback from this many seconds in (0/undefined = from the start). */
  startTime?: number;
  /**
   * Lesson thumbnail shown while the token + iframe load, and passed to the
   * Cloudflare player as its poster — no blank box before playback.
   */
  posterUrl?: string;
  /** Request autoplay (watch page — arrival is always a deliberate click).
   *  Browsers may still require a tap on a cold deep-link; that's their call. */
  autoplay?: boolean;
  /** Fires when the video finishes. Requires the Stream SDK (loaded lazily). */
  onEnded?: () => void;
  /** Fires on playback progress (throttled by the SDK's timeupdate cadence). */
  onTimeUpdate?: (seconds: number) => void;
}

/** Cloudflare's iframe-control SDK; one load per page. */
let sdkPromise: Promise<void> | null = null;
function loadStreamSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Stream) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error("Stream SDK failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return sdkPromise;
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
 *
 * When `onEnded`/`onTimeUpdate` are provided (the watch page), the Cloudflare
 * Stream SDK is attached to the iframe for playback events; other surfaces
 * pay no SDK cost.
 */
export function SecureStreamPlayer({
  contentId,
  className = "",
  renderPaywall,
  paywallHref = "/",
  startTime,
  posterUrl,
  autoplay = false,
  onEnded,
  onTimeUpdate,
}: SecureStreamPlayerProps) {
  const [src, setSrc] = useState("");
  const [mark, setMark] = useState("");
  const [denied, setDenied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // Keep the latest callbacks without re-attaching SDK listeners.
  const endedRef = useRef(onEnded);
  const timeRef = useRef(onTimeUpdate);
  endedRef.current = onEnded;
  timeRef.current = onTimeUpdate;
  const wantsEvents = !!(onEnded || onTimeUpdate);

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
        const resume =
          startTime && startTime > 0 ? `&startTime=${Math.floor(startTime)}s` : "";
        const auto = autoplay ? "&autoplay=true" : "";
        const poster = posterUrl
          ? `&poster=${encodeURIComponent(posterUrl)}`
          : "";
        // letterboxColor: sub-pixel letterboxing (Safari at fractional sizes)
        // paints white instead of the player's default black.
        setSrc(
          `${iframe}?controls=true&letterboxColor=%23ffffff${poster}${resume}${auto}`
        );
        setMark(watermark ?? "");
      }
    })();
    return () => {
      off = true;
    };
    // startTime is intentionally captured per-content: callers re-key the
    // component to restart playback ("Start over").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  // Attach the Stream SDK for playback events (watch page only).
  useEffect(() => {
    if (!wantsEvents || !src || !iframeRef.current) return;
    let cancelled = false;
    let player: {
      addEventListener: (ev: string, fn: () => void) => void;
      currentTime: number;
    } | null = null;

    const handleEnded = () => endedRef.current?.();
    const handleTime = () => {
      if (player) timeRef.current?.(Math.floor(player.currentTime));
    };

    loadStreamSdk()
      .then(() => {
        if (cancelled || !iframeRef.current) return;
        const Stream = (window as any).Stream;
        if (!Stream) return;
        player = Stream(iframeRef.current);
        player!.addEventListener("ended", handleEnded);
        player!.addEventListener("timeupdate", handleTime);
      })
      .catch(() => {
        /* events are enhancement-only; playback works without them */
      });

    return () => {
      cancelled = true;
      // The SDK offers no removeEventListener teardown; the iframe unmounts
      // with the component, which drops the postMessage channel.
    };
  }, [wantsEvents, src]);

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
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-lg bg-muted",
          !posterUrl && "animate-pulse",
          className
        )}
      >
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        ref={iframeRef}
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
