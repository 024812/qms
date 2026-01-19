/**
 * Quilts REST API - Image Management
 *
 * PUT /api/quilts/[id]/images - Update quilt images
 * DELETE /api/quilts/[id]/images - Delete a specific attachment image
 *
 * Requirements: 1.2, 1.3 - REST API for quilts
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getQuiltById, updateQuilt } from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for image update
const updateImagesSchema = z.object({
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
});

// Validation schema for image deletion
const deleteImageSchema = z.object({
  imageIndex: z.number().int().min(0, '图片索引必须是非负整数'),
});

/**
 * PUT /api/quilts/[id]/images
 *
 * Update quilt images (main image and/or attachment images).
 *
 * Request Body:
 * - mainImage?: string | null
 * - attachmentImages?: string[] | null
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必需的');
    }

    const rawBody = await request.json();

    // Sanitize input to prevent XSS (Requirements: 11.1)
    const body = sanitizeApiInput(rawBody);

    // Validate input
    const validationResult = updateImagesSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '图片数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { mainImage, attachmentImages } = validationResult.data;

    // Get current quilt
    const quilt = await getQuiltById(id);
    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    // Update with new images
    const updatedQuilt = await updateQuilt(id, {
      mainImage: mainImage !== undefined ? mainImage : quilt.mainImage,
      attachmentImages: attachmentImages !== undefined ? attachmentImages : quilt.attachmentImages,
    });

    return createSuccessResponse({ quilt: updatedQuilt });
  } catch (error) {
    return createInternalErrorResponse('更新被子图片失败', error);
  }
}

/**
 * DELETE /api/quilts/[id]/images
 *
 * Delete a specific attachment image by index.
 *
 * Query Parameters:
 * - imageIndex: number - The index of the image to delete
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageIndexStr = searchParams.get('imageIndex');

    if (!id) {
      return createBadRequestResponse('被子 ID 是必需的');
    }

    if (imageIndexStr === null) {
      return createBadRequestResponse('图片索引是必需的');
    }

    const imageIndex = parseInt(imageIndexStr, 10);

    // Validate input
    const validationResult = deleteImageSchema.safeParse({ imageIndex });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '图片索引验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Get current quilt
    const quilt = await getQuiltById(id);
    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    // Check if attachment images exist
    if (!quilt.attachmentImages || quilt.attachmentImages.length === 0) {
      return createBadRequestResponse('没有附件图片');
    }

    // Check if index is valid
    if (imageIndex >= quilt.attachmentImages.length) {
      return createBadRequestResponse('无效的图片索引');
    }

    // Remove the image at the specified index
    const newImages = [...quilt.attachmentImages];
    newImages.splice(imageIndex, 1);

    // Update quilt
    const updatedQuilt = await updateQuilt(id, {
      attachmentImages: newImages,
    });

    return createSuccessResponse({ quilt: updatedQuilt });
  } catch (error) {
    return createInternalErrorResponse('删除被子附件图片失败', error);
  }
}
