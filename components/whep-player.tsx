"use client";

import { useEffect, useRef, useState } from "react";
import { WHEPClient } from "@eyevinn/webrtc-player";

interface WHEPPlayerProps {
  whepUrl: string;
  autoplay?: boolean;
  muted?: boolean;
  poster?: string;
  className?: string;
}

/**
 * WHEP (WebRTC HTTP Egress Protocol) Player
 * Used for low-latency playback of WHIP live streams
 */
export function WHEPPlayer({
  whepUrl,
  autoplay = true,
  muted = false,
  poster,
  className = "",
}: WHEPPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<WHEPClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !whepUrl) return;

    let mounted = true;

    const startPlayback = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create WHEP client
        const client = new WHEPClient({
          url: whepUrl,
          videoElement,
          autoplay,
        });

        clientRef.current = client;

        // Wait for client to initialize
        await client.load();

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("WHEP playback error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load stream");
          setIsLoading(false);
        }
      }
    };

    startPlayback();

    // Cleanup
    return () => {
      mounted = false;
      if (clientRef.current) {
        clientRef.current.destroy();
        clientRef.current = null;
      }
    };
  }, [whepUrl, autoplay]);

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
          <div className="text-center max-w-md p-6">
            <p className="text-red-700 font-semibold mb-2">Stream Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full rounded-lg bg-black"
        autoPlay={autoplay}
        muted={muted}
        playsInline
        controls
        poster={poster}
      />
    </div>
  );
}
