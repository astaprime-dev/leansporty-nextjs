"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, MonitorPlay } from "lucide-react";

interface BrowserBroadcastProps {
  webrtcUrl: string;
  webrtcToken?: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

type ConnectionState = "idle" | "requesting" | "connecting" | "connected" | "disconnected" | "failed";

export function BrowserBroadcast({
  webrtcUrl,
  webrtcToken,
  onStreamStart,
  onStreamEnd,
}: BrowserBroadcastProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up without triggering end stream dialog on page navigation
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const startBroadcast = async () => {
    try {
      setError(null);
      setConnectionState("requesting");

      // Validate Cloudflare WebRTC URL
      if (!webrtcUrl) {
        throw new Error("WebRTC URL not configured. Stream may not have been created properly.");
      }

      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setConnectionState("connecting");

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("ICE candidate:", event.candidate);
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log("Connection state:", state);

        if (state === "connected") {
          setConnectionState("connected");
          onStreamStart?.();
        } else if (state === "failed" || state === "disconnected") {
          setConnectionState("failed");
          setError("Connection lost. Please try reconnecting.");
          // Clean up without triggering end stream dialog
          cleanupBroadcast();
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Wait for ICE gathering to complete (important for Cloudflare)
      await new Promise<void>((resolve) => {
        if (peerConnection.iceGatheringState === "complete") {
          resolve();
        } else {
          peerConnection.addEventListener("icegatheringstatechange", () => {
            if (peerConnection.iceGatheringState === "complete") {
              resolve();
            }
          });
        }
      });

      // Get the complete SDP after ICE gathering
      const localDesc = peerConnection.localDescription;
      if (!localDesc || !localDesc.sdp) {
        throw new Error("Failed to get local description");
      }

      // Normalize SDP line endings for Cloudflare (strict CRLF requirement)
      let sdp = localDesc.sdp;

      // Method 1: Remove all \r first, then replace all \n with \r\n
      sdp = sdp.replace(/\r/g, ""); // Remove existing \r
      sdp = sdp.replace(/\n/g, "\r\n"); // Replace all \n with \r\n

      // Ensure ends with exactly one \r\n
      sdp = sdp.replace(/(\r\n)+$/, ""); // Remove trailing CRLFs
      sdp += "\r\n"; // Add single final CRLF

      console.log("Normalized SDP:", {
        length: sdp.length,
        endsWithCRLF: sdp.endsWith("\r\n"),
        lineCount: sdp.split("\r\n").length - 1,
        lastChars: sdp.slice(-10).split("").map(c => c.charCodeAt(0))
      });

      // Send offer to Cloudflare Stream
      console.log("Connecting to Cloudflare WebRTC URL:", webrtcUrl);

      const response = await fetch(webrtcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sdp: sdp,
          streamKey: webrtcToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare response error:", response.status, errorText);
        throw new Error(`Cloudflare error (${response.status}): ${errorText || "Connection failed"}`);
      }

      const answer = await response.json();

      // Set remote description
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answer.sdp,
        })
      );

      setConnectionState("connected");
    } catch (err) {
      console.error("Broadcast error:", err);
      setConnectionState("failed");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start broadcast. Please check camera/microphone permissions."
      );
      // Clean up without triggering onStreamEnd (this is an error, not intentional stop)
      cleanupBroadcast();
    }
  };

  const cleanupBroadcast = () => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video preview
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setConnectionState("idle");
  };

  const stopBroadcast = () => {
    // Clean up resources
    cleanupBroadcast();
    // Notify parent component (only when user intentionally stops)
    onStreamEnd?.();
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover"
        />

        {connectionState === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ready to broadcast</p>
              <p className="text-sm opacity-70 mt-2">Click "Start Broadcast" to begin</p>
            </div>
          </div>
        )}

        {/* Connection Status Overlay */}
        {connectionState !== "idle" && connectionState !== "connected" && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <span className="text-sm font-medium">
              {connectionState === "requesting" && "Requesting camera access..."}
              {connectionState === "connecting" && "Connecting to stream..."}
              {connectionState === "failed" && "Connection failed"}
            </span>
          </div>
        )}

        {connectionState === "connected" && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {connectionState === "idle" ? (
          <Button
            onClick={startBroadcast}
            className="bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
            size="lg"
          >
            Start Broadcast
          </Button>
        ) : connectionState === "connected" ? (
          <>
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="lg"
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="lg"
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            <Button onClick={stopBroadcast} variant="destructive" size="lg">
              Stop Broadcast
            </Button>
          </>
        ) : (
          <Button onClick={stopBroadcast} variant="outline" disabled>
            Cancel
          </Button>
        )}
      </div>

      {/* Browser Compatibility Warning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-800 font-medium mb-2">Browser Requirements:</p>
        <ul className="text-blue-700 space-y-1 text-xs">
          <li>• Chrome, Firefox, Safari, or Edge (latest version)</li>
          <li>• Camera and microphone permissions required</li>
          <li>• Stable internet connection (at least 5 Mbps upload)</li>
        </ul>
      </div>
    </div>
  );
}
