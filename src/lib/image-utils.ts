/**
 * Image Utilities
 *
 * Provides functions for image compression, validation, and Base64 encoding
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.82,
  outputFormat: 'image/webp',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate image file
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件类型。仅支持 JPEG、PNG 和 WebP 格式。`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `文件太大。最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB。`,
    };
  }

  return { valid: true };
}

/**
 * Compress and encode image to Base64
 */
export async function compressAndEncodeImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();
    const img = new Image();

    reader.onload = e => {
      if (!e.target?.result) {
        reject(new Error('无法读取文件'));
        return;
      }

      img.src = e.target.result as string;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法创建画布上下文'));
            return;
          }

          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to Base64 with iterative quality reduction
          let quality = opts.quality;
          let base64 = canvas.toDataURL(opts.outputFormat, quality);
          const maxBytes = 200 * 1024 * (4 / 3); // 200KB target in base64 chars

          while (base64.length > maxBytes && quality > 0.4) {
            quality -= 0.05;
            base64 = canvas.toDataURL(opts.outputFormat, quality);
          }

          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('无法加载图片'));
      };
    };

    reader.onerror = () => {
      reject(new Error('无法读取文件'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images
 */
export async function compressAndEncodeImages(
  files: File[],
  options: ImageCompressionOptions = {}
): Promise<string[]> {
  const promises = files.map(file => compressAndEncodeImage(file, options));
  return Promise.all(promises);
}

/**
 * Get image dimensions from Base64 string
 */
export async function getImageDimensions(
  base64: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('无法加载图片'));
    };

    img.src = base64;
  });
}

/**
 * Get Base64 string size in bytes
 */
export function getBase64Size(base64: string): number {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;

  // Calculate size (Base64 is ~33% larger than binary)
  return (base64Data.length * 3) / 4;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

/**
 * Create a thumbnail from Base64 image
 */
export async function createThumbnail(base64: string, maxSize: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建画布上下文'));
        return;
      }

      // Calculate thumbnail dimensions
      let width = img.width;
      let height = img.height;
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnail);
    };

    img.onerror = () => {
      reject(new Error('无法加载图片'));
    };

    img.src = base64;
  });
}
