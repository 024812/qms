'use server';

/**
 * Image Upload Service
 * 
 * This service handles image uploads by storing base64-encoded images
 * directly in the Neon PostgreSQL database as strings.
 * 
 * Requirements: 6.1 - Image upload and storage service
 */

import { auth } from '@/auth';
import { z } from 'zod';

/**
 * Maximum file size: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Image upload validation schema
 */
const imageUploadSchema = z.object({
  base64Data: z.string().min(1, '图片数据不能为空'),
  mimeType: z.enum(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'], {
    message: '不支持的图片格式',
  }),
  fileName: z.string().optional(),
});

/**
 * Upload an image
 * 
 * Accepts a base64-encoded image and returns a data URL that can be stored
 * in the database and used directly in img src attributes.
 * 
 * @param data - Image upload data
 * @returns Data URL string
 */
export async function uploadImage(data: {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}): Promise<{ url: string; error?: string }> {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { url: '', error: '您必须登录才能上传图片' };
    }

    // Validate input
    const validationResult = imageUploadSchema.safeParse(data);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.values(errors).flat().join(', ');
      return { url: '', error: errorMessage };
    }

    const { base64Data, mimeType } = validationResult.data;

    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
      return { url: '', error: '无效的图片数据格式' };
    }

    // Calculate file size (base64 is ~33% larger than binary)
    const estimatedSize = (base64String.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return {
        url: '',
        error: `图片大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`,
      };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { url: '', error: '不支持的图片格式' };
    }

    // Create data URL
    const dataUrl = `data:${mimeType};base64,${base64String}`;

    return { url: dataUrl };
  } catch (error) {
    console.error('Image upload error:', error);
    return { url: '', error: '图片上传失败，请重试' };
  }
}

/**
 * Upload multiple images
 * 
 * @param images - Array of image upload data
 * @returns Array of data URLs
 */
export async function uploadImages(
  images: Array<{
    base64Data: string;
    mimeType: string;
    fileName?: string;
  }>
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const image of images) {
    const result = await uploadImage(image);
    if (result.error) {
      errors.push(result.error);
    } else {
      urls.push(result.url);
    }
  }

  return { urls, errors };
}

/**
 * Delete an image
 * 
 * Since images are stored as data URLs in the database, deletion is handled
 * by removing the URL from the database record. This function is a no-op
 * but provided for API consistency.
 * 
 * @param url - Image URL to delete
 * @returns Success status
 */
export async function deleteImage(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: '您必须登录才能删除图片' };
    }

    // Validate that it's a data URL
    if (!url.startsWith('data:image/')) {
      return { success: false, error: '无效的图片 URL' };
    }

    // For data URLs stored in database, deletion is handled by removing
    // the URL from the database record. No additional cleanup needed.
    return { success: true };
  } catch (error) {
    console.error('Image deletion error:', error);
    return { success: false, error: '图片删除失败，请重试' };
  }
}

/**
 * Validate image data URL
 * 
 * @param url - Data URL to validate
 * @returns Validation result
 */
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: '图片 URL 不能为空' };
  }

  if (!url.startsWith('data:image/')) {
    return { valid: false, error: '无效的图片 URL 格式' };
  }

  const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { valid: false, error: '无效的 data URL 格式' };
  }

  const [, mimeType, base64Data] = match;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: '不支持的图片格式' };
  }

  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    return { valid: false, error: '无效的 base64 数据' };
  }

  return { valid: true };
}

/**
 * Get image metadata from data URL
 * 
 * @param url - Data URL
 * @returns Image metadata
 */
export function getImageMetadata(url: string): {
  mimeType?: string;
  size?: number;
  error?: string;
} {
  const validation = validateImageUrl(url);
  if (!validation.valid) {
    return { error: validation.error };
  }

  const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { error: '无法解析图片数据' };
  }

  const [, mimeType, base64Data] = match;
  const estimatedSize = (base64Data.length * 3) / 4;

  return {
    mimeType,
    size: estimatedSize,
  };
}
