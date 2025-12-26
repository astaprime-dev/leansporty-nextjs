// Cloudflare Images API Service
// Handles image and video uploads to Cloudflare Images
// Follows the same pattern as cloudflare-stream.ts

interface CloudflareAPIResponse<T> {
  result: T;
  success: boolean;
  errors?: Array<{ message: string }>;
  messages?: Array<{ message: string }>;
}

interface CloudflareImageResult {
  id: string;
  filename: string;
  uploaded: string;
  requireSignedURLs: boolean;
  variants: string[];
}

interface CloudflareImageUploadResponse {
  imageId: string;
  imageUrl: string;
  variants: string[];
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Make authenticated API call to Cloudflare
 */
async function callCloudflareAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare credentials in environment variables');
  }

  const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      ...options.headers,
    },
  });

  const data: CloudflareAPIResponse<T> = await response.json();

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || 'Unknown Cloudflare API error';
    throw new Error(`Cloudflare API error: ${errorMessage}`);
  }

  return data.result;
}

/**
 * Upload an image to Cloudflare Images
 * Supports both images and videos (Cloudflare Images supports video)
 * @param fileBuffer - The file buffer to upload
 * @param filename - Original filename
 * @param metadata - Optional metadata to attach (userId, type, etc.)
 * @returns Upload response with imageId and URLs
 */
export async function uploadImage(
  fileBuffer: Buffer,
  filename: string,
  metadata?: {
    userId?: string;
    instructorId?: string;
    type?: 'profile_photo' | 'gallery_item';
    order?: number;
  }
): Promise<CloudflareImageUploadResponse> {
  const formData = new FormData();

  // Create blob from buffer
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, filename);

  // Add metadata if provided
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const result = await callCloudflareAPI<CloudflareImageResult>(
    '/images/v1',
    {
      method: 'POST',
      body: formData,
    }
  );

  // Cloudflare returns the full URLs in the variants array
  // Find the public variant URL (or use the first variant if public doesn't exist)
  const publicVariant = result.variants.find(url => url.includes('/public'));
  const imageUrl = publicVariant || result.variants[0];

  if (!imageUrl) {
    throw new Error('No image URL returned from Cloudflare');
  }

  return {
    imageId: result.id,
    imageUrl,
    variants: result.variants,
  };
}

/**
 * Upload a video to Cloudflare Images
 * Note: Cloudflare Images supports video up to 100MB and various formats
 * This is a convenience wrapper around uploadImage() for clarity
 */
export async function uploadVideo(
  fileBuffer: Buffer,
  filename: string,
  metadata?: {
    userId?: string;
    instructorId?: string;
    type?: 'profile_photo' | 'gallery_item';
    order?: number;
  }
): Promise<CloudflareImageUploadResponse> {
  // Cloudflare Images handles both images and videos through the same endpoint
  return uploadImage(fileBuffer, filename, metadata);
}

/**
 * Delete an image or video from Cloudflare Images
 * @param imageId - The Cloudflare image ID to delete
 * @returns True if deletion was successful
 */
export async function deleteMedia(imageId: string): Promise<boolean> {
  try {
    await callCloudflareAPI(
      `/images/v1/${imageId}`,
      {
        method: 'DELETE',
      }
    );
    return true;
  } catch (error) {
    console.error('Error deleting media from Cloudflare:', error);
    return false;
  }
}

/**
 * Generate optimized image URL with transformations
 * Uses Cloudflare's image resizing service
 * @param imageId - The Cloudflare image ID
 * @param options - Transformation options
 * @returns Optimized image URL
 *
 * NOTE: Requires CLOUDFLARE_ACCOUNT_HASH environment variable
 * This is different from CLOUDFLARE_ACCOUNT_ID - it's the hash used in imagedelivery.net URLs
 * You can find it in any Cloudflare Images URL or in your Cloudflare dashboard
 */
export function getImageUrl(
  imageId: string,
  options?: {
    width?: number;
    height?: number;
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    format?: 'auto' | 'webp' | 'avif' | 'json';
    quality?: number;
  }
): string {
  const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;

  if (!accountHash) {
    throw new Error('CLOUDFLARE_ACCOUNT_HASH environment variable is required for image transformations');
  }

  if (!options || Object.keys(options).length === 0) {
    // Return public URL without transformations
    return `https://imagedelivery.net/${accountHash}/${imageId}/public`;
  }

  // Build transformation string for flexible variants
  const transformParams: string[] = [];

  if (options.width) transformParams.push(`width=${options.width}`);
  if (options.height) transformParams.push(`height=${options.height}`);
  if (options.fit) transformParams.push(`fit=${options.fit}`);
  if (options.format) transformParams.push(`format=${options.format}`);
  if (options.quality) transformParams.push(`quality=${options.quality}`);

  const transformString = transformParams.join(',');

  // Use Cloudflare's flexible variant transformation service
  return `https://imagedelivery.net/${accountHash}/${imageId}/${transformString}`;
}

/**
 * Get thumbnail URL for an image
 * Convenience method for common thumbnail use case
 */
export function getThumbnailUrl(imageId: string, size: number = 300): string {
  return getImageUrl(imageId, {
    width: size,
    height: size,
    fit: 'cover',
    format: 'auto',
  });
}

/**
 * Get full-size optimized URL for an image
 * Convenience method for full-size display
 */
export function getFullSizeUrl(imageId: string, maxSize: number = 1200): string {
  return getImageUrl(imageId, {
    width: maxSize,
    height: maxSize,
    fit: 'contain',
    format: 'auto',
  });
}
