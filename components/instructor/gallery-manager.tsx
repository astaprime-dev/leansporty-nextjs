'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GalleryItem {
  id: string;
  media_type: 'image' | 'video';
  cloudflare_url: string;
  cloudflare_image_id: string;
  display_order: number;
  caption: string | null;
}

interface GalleryManagerProps {
  instructorId: string;
}

function SortableGalleryItem({
  item,
  onDelete,
  onCaptionUpdate,
}: {
  item: GalleryItem;
  onDelete: (id: string) => void;
  onCaptionUpdate: (id: string, caption: string) => void;
}) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState(item.caption || '');
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCaptionSave = () => {
    onCaptionUpdate(item.id, caption);
    setIsEditingCaption(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative group bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-pink-300 transition-colors"
    >
      {/* Drag Handle */}
      <div
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/90 rounded cursor-move z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Media Preview */}
      <div className="aspect-square relative bg-gray-100">
        {item.media_type === 'image' ? (
          <Image
            src={item.cloudflare_url}
            alt={item.caption || 'Gallery item'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={item.cloudflare_url}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <svg
                className="w-16 h-16 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Caption */}
      <div className="p-2">
        {isEditingCaption ? (
          <div className="space-y-1">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Add caption..."
              className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
            />
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCaptionSave();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCaption(item.caption || '');
                  setIsEditingCaption(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingCaption(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-gray-600 truncate cursor-text hover:bg-gray-100 rounded px-1"
          >
            {item.caption || 'Add caption...'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GalleryManager({ instructorId }: GalleryManagerProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      const response = await fetch('/api/instructor/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery');

      const { galleryItems } = await response.json();
      setGalleryItems(galleryItems || []);
    } catch (err: any) {
      console.error('Error fetching gallery:', err);
      setError('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/instructor/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      await fetchGalleryItems();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/instructor/gallery?id=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setGalleryItems((items) => items.filter((item) => item.id !== itemId));
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Failed to delete item');
    }
  };

  const handleCaptionUpdate = async (itemId: string, caption: string) => {
    try {
      const response = await fetch('/api/instructor/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, caption }),
      });

      if (!response.ok) throw new Error('Failed to update caption');

      setGalleryItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, caption } : item
        )
      );
    } catch (err: any) {
      console.error('Caption update error:', err);
      setError('Failed to update caption');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = galleryItems.findIndex((item) => item.id === active.id);
      const newIndex = galleryItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(galleryItems, oldIndex, newIndex);

      // Update display_order for all affected items
      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      setGalleryItems(newItems);

      // Update in database
      try {
        await Promise.all(
          updates.map((update) =>
            fetch('/api/instructor/gallery', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: update.id,
                displayOrder: update.display_order,
              }),
            })
          )
        );
      } catch (err) {
        console.error('Error updating order:', err);
        fetchGalleryItems(); // Revert on error
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading gallery...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Gallery</h3>
          <p className="text-sm text-gray-500">
            Upload up to 8 images or videos to showcase on your profile
          </p>
        </div>

        {galleryItems.length < 8 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Add Media'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {galleryItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No gallery items yet</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700"
          >
            Upload Your First Item
          </button>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={galleryItems.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <SortableGalleryItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onCaptionUpdate={handleCaptionUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-gray-500">
        {galleryItems.length} / 8 items used. Drag items to reorder.
      </p>
    </div>
  );
}
