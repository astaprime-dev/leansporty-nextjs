"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, MonitorPlay, Camera, Headphones } from "lucide-react";

interface BrowserBroadcastProps {
  webrtcUrl: string;
  webrtcToken?: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

type ConnectionState = "idle" | "requesting" | "connecting" | "connected" | "disconnected" | "failed";

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

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

  // Device selection state
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Enumerate available devices on mount
  useEffect(() => {
    enumerateDevices();
  }, []);

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

  const enumerateDevices = async () => {
    try {
      // Request permissions first to get device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Now enumerate devices (labels will be available after permission granted)
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Stop temporary stream
      tempStream.getTracks().forEach(track => track.stop());

      const videoInputs = devices
        .filter(device => device.kind === "videoinput")
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${devices.filter(d => d.kind === "videoinput").indexOf(device) + 1}`,
        }));

      const audioInputs = devices
        .filter(device => device.kind === "audioinput")
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${devices.filter(d => d.kind === "audioinput").indexOf(device) + 1}`,
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      // Set default selections to first available device
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  };

  const startBroadcast = async () => {
    try {
      setError(null);
      setConnectionState("requesting");

      // Validate Cloudflare WebRTC URL
      if (!webrtcUrl) {
        throw new Error("WebRTC URL not configured. Stream may not have been created properly.");
      }

      // Request camera and microphone permissions with selected devices
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice
          ? {
              deviceId: { exact: selectedVideoDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
        audio: selectedAudioDevice
          ? {
              deviceId: { exact: selectedAudioDevice },
              echoCancellation: true,
              noiseSuppression: true,
            }
          : {
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
        lastChars: sdp.slice(-10).split("").map(c => c.charCodeAt(0)),
        last20Chars: sdp.slice(-20).split("").map(c => c.charCodeAt(0))
      });

      // Log first and last few lines to verify structure
      const lines = sdp.split("\r\n");
      console.log("First 3 SDP lines:", lines.slice(0, 3));
      console.log("Last 5 SDP lines:", lines.slice(-5));

      // Send offer to Cloudflare Stream using WHIP protocol (RFC 9725)
      console.log("Connecting to Cloudflare WebRTC URL:", webrtcUrl);
      console.log("SDP being sent:", {
        length: sdp.length,
        endsWithCRLF: sdp.endsWith("\r\n"),
        hasToken: !!webrtcToken
      });

      const response = await fetch(webrtcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          ...(webrtcToken ? { "Authorization": `Bearer ${webrtcToken}` } : {}),
        },
        body: sdp, // Send raw SDP text, not JSON!
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare response error:", response.status, errorText);
        throw new Error(`Cloudflare error (${response.status}): ${errorText || "Connection failed"}`);
      }

      // WHIP protocol returns SDP answer as plain text (application/sdp), not JSON
      const answerSdp = await response.text();
      console.log("Received SDP answer from Cloudflare:", answerSdp.substring(0, 100) + "...");

      // Set remote description
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answerSdp,
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

  const switchCamera = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);

    // If already broadcasting, switch the camera
    if (streamRef.current && peerConnectionRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];

        // Replace track in peer connection
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        // Replace track in stream
        streamRef.current.removeTrack(oldVideoTrack);
        streamRef.current.addTrack(newVideoTrack);

        // Update video preview
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }

        // Stop old track
        oldVideoTrack.stop();
      } catch (err) {
        console.error("Failed to switch camera:", err);
        setError("Failed to switch camera. Please try again.");
      }
    }
  };

  const switchMicrophone = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);

    // If already broadcasting, switch the microphone
    if (streamRef.current && peerConnectionRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        const newAudioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = streamRef.current.getAudioTracks()[0];

        // Replace track in peer connection
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "audio");

        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        }

        // Replace track in stream
        streamRef.current.removeTrack(oldAudioTrack);
        streamRef.current.addTrack(newAudioTrack);

        // Stop old track
        oldAudioTrack.stop();
      } catch (err) {
        console.error("Failed to switch microphone:", err);
        setError("Failed to switch microphone. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Device Selection */}
      {(videoDevices.length > 1 || audioDevices.length > 1) && (
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Device Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Selection */}
            {videoDevices.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Camera
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Microphone Selection */}
            {audioDevices.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Microphone
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => switchMicrophone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-full" style={{ paddingBottom: "56.25%" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-contain"
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
