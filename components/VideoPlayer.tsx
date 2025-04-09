// components/VideoPlayer.tsx
'use client';

import MuxPlayer from './MuxPlayerWrapper';


type VideoPlayerProps = {
  playbackId?: string | null;
  title: string;
  duration: string;
  gradientClass: string;
};

export default function VideoPlayer({
  playbackId,
  title,
  duration,
  gradientClass,
}: VideoPlayerProps) {
  return (
    <div
      className={`relative w-full lg:w-1/2 aspect-video overflow-hidden shadow-xl rounded-xl bg-gradient-to-br ${gradientClass}`}
    >
      {playbackId ? (
        <MuxPlayer
          playbackId="YuAzNME95mzbh01SD3d6laEpEEOz5wmBLkHNXWmu8HVo"
          streamType="on-demand"
          controls
          autoPlay={false}
          muted={false}
          className="w-full h-full rounded-xl"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-white text-2xl font-semibold p-6">
          🎬 Video Coming Soon
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-5 text-white">
        <div className="text-2xl font-bold">{title}</div>
        <div className="text-sm text-white/70 mt-1">{duration}</div>
      </div>
    </div>
  );
}
