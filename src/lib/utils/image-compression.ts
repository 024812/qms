'use client';

/**
 * Image compression utility for optimizing images before AI recognition
 * Compresses images to reduce file size and improve network performance
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeKB: 1024, // 1MB
};

/**
 * Compress a base64 image using canvas
 * @param base64Image - The original base64 image string
 * @param options - Compression options
 * @returns Compressed base64 image string
 */
export async function compressImage(
  base64Image: string,
  options: CompressOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress with quality adjustment
        let quality = opts.quality!;
        let result = canvas.toDataURL('image/jpeg', quality);

        // If still too large, reduce quality iteratively
        const maxBytes = (opts.maxSizeKB! * 1024 * 4) / 3; // Base64 overhead
        while (result.length > maxBytes && quality > 0.3) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Handle both data URL and raw base64
    img.src = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
  });
}

/**
 * Get image dimensions from base64
 */
export function getImageDimensions(
  base64Image: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
  });
}

/**
 * Get approximate file size of base64 image in KB
 */
export function getBase64SizeKB(base64Image: string): number {
  // Remove data URL prefix if present
  const base64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  // Base64 encodes 3 bytes into 4 characters
  const bytes = (base64.length * 3) / 4;
  return Math.round(bytes / 1024);
}
