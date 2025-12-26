'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';

interface GalleryItem {
  id: string;
  media_type: 'image' | 'video';
  cloudflare_url: string;
  caption: string | null;
}

interface GalleryDisplayProps {
  galleryItems: GalleryItem[];
}

export default function GalleryDisplay({ galleryItems }: GalleryDisplayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!galleryItems || galleryItems.length === 0) {
    return null;
  }

  // Convert gallery items to lightbox slides
  const slides = galleryItems.map((item) => {
    if (item.media_type === 'video') {
      return {
        type: 'video' as const,
        sources: [
          {
            src: item.cloudflare_url,
            type: 'video/mp4',
          },
        ],
        description: item.caption || undefined,
      };
    } else {
      return {
        src: item.cloudflare_url,
        alt: item.caption || 'Gallery image',
        description: item.caption || undefined,
      };
    }
  });

  const handleItemClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
        Portfolio
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {galleryItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group hover:ring-2 hover:ring-pink-500 transition-all"
          >
            {item.media_type === 'image' ? (
              <Image
                src={item.cloudflare_url}
                alt={item.caption || 'Gallery image'}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.cloudflare_url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
                  <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-8 h-8 text-pink-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Caption Overlay */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm line-clamp-2">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Video]}
        animation={{ fade: 300 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
}
