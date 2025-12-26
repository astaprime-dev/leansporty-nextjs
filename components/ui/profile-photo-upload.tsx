'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import ImageCropModal from './image-crop-modal';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoChange: (url: string) => void;
  isLoading?: boolean;
}

export default function ProfilePhotoUpload({
  currentPhotoUrl,
  onPhotoChange,
  isLoading = false,
}: ProfilePhotoUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Please select an image under 5MB');
      return;
    }

    setError('');

    // Create object URL for the cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError('');

    try {
      // Upload cropped image
      const formData = new FormData();
      formData.append('file', croppedBlob, 'profile-photo.jpg');

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { imageUrl } = await response.json();
      onPhotoChange(imageUrl);
      setSelectedImage(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex items-center gap-6">
        {/* Photo Preview */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center ring-4 ring-pink-100">
            {currentPhotoUrl ? (
              <Image
                src={currentPhotoUrl}
                alt="Profile photo"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-4xl font-bold text-white">?</span>
            )}
          </div>

          {/* Hover Overlay */}
          {currentPhotoUrl && (
            <div
              onClick={handleClick}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span className="text-white text-sm font-medium">Change Photo</span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading || isUploading}
          />

          <button
            type="button"
            onClick={handleClick}
            disabled={isLoading || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>

          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG or WebP. Max 5MB. Will be cropped to square.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Crop Modal */}
      {selectedImage && (
        <ImageCropModal
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
  );
}
