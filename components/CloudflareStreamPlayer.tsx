"use client";

import { useEffect, useRef, useState } from "react";

interface CloudflareStreamPlayerProps {
  playbackId: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;
  className?: string;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

/**
 * Cloudflare Stream Video Player
 * Uses iframe embed for both live streams and on-demand videos
 */
export function CloudflareStreamPlayer({
  playbackId,
  autoplay = false,
  muted = false,
  controls = true,
  poster,
  className = "",
  onReady,
  onPlay,
  onPause,
  onEnded,
  onPlayStateChange,
}: CloudflareStreamPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Build Cloudflare Stream iframe URL with parameters
    const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;

    if (!customerCode) {
      console.error("Missing NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE");
      return;
    }

    const params = new URLSearchParams({
      autoplay: autoplay ? "true" : "false",
      muted: muted ? "true" : "false",
      controls: controls ? "true" : "false",
      preload: "auto",
    });

    if (poster) {
      params.set("poster", poster);
    }

    const url = `https://customer-${customerCode}.cloudflarestream.com/${playbackId}/iframe?${params.toString()}`;
    setEmbedUrl(url);
  }, [playbackId, autoplay, muted, controls, poster]);

  useEffect(() => {
    // Listen for iframe load event
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      onReady?.();
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [onReady]);

  // Listen for Cloudflare Stream player events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from Cloudflare Stream
      if (!event.origin.includes('cloudflarestream.com')) return;

      const data = event.data;

      // Handle different event types from Cloudflare Stream
      if (data.event === 'play') {
        onPlay?.();
        onPlayStateChange?.(true);
      } else if (data.event === 'pause') {
        onPause?.();
        onPlayStateChange?.(false);
      } else if (data.event === 'ended') {
        onEnded?.();
        onPlayStateChange?.(false);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onPlay, onPause, onEnded, onPlayStateChange]);

  if (!embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">Unable to load player</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Cloudflare Stream iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        style={{ border: 0 }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
