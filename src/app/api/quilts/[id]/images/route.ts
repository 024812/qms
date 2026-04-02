import { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createBadRequestResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';
import { getQuiltById, saveQuilt } from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';

import { applyQuiltCompatibilityHeaders } from '../../_shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateImagesSchema = z.object({
  mainImage: z.string().nullable().optional(),
  attachmentImages: z.array(z.string()).nullable().optional(),
});

const deleteImageSchema = z.object({
  imageIndex: z.number().int().min(0, '图片索引必须是非负整数'),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必须的');
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return createBadRequestResponse('Invalid JSON request body');
    }

    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return createBadRequestResponse('Request body must be a JSON object');
    }

    const body = sanitizeApiInput(rawBody as Record<string, unknown>);
    const validationResult = updateImagesSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '图片数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const quilt = await getQuiltById(id);
    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    const { mainImage, attachmentImages } = validationResult.data;
    const result = await saveQuilt({
      id,
      mainImage: mainImage !== undefined ? mainImage : quilt.mainImage,
      attachmentImages: attachmentImages !== undefined ? attachmentImages : quilt.attachmentImages,
    });

    return applyQuiltCompatibilityHeaders(createSuccessResponse({ quilt: result.quilt }));
  } catch (error) {
    return createInternalErrorResponse('更新被子图片失败', error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageIndexStr = searchParams.get('imageIndex');

    if (!id) {
      return createBadRequestResponse('被子 ID 是必须的');
    }

    if (imageIndexStr === null) {
      return createBadRequestResponse('图片索引是必须的');
    }

    const imageIndex = parseInt(imageIndexStr, 10);
    const validationResult = deleteImageSchema.safeParse({ imageIndex });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '图片索引验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const quilt = await getQuiltById(id);
    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    if (!quilt.attachmentImages || quilt.attachmentImages.length === 0) {
      return createBadRequestResponse('没有附件图片');
    }

    if (imageIndex >= quilt.attachmentImages.length) {
      return createBadRequestResponse('无效的图片索引');
    }

    const nextImages = [...quilt.attachmentImages];
    nextImages.splice(imageIndex, 1);

    const result = await saveQuilt({
      id,
      attachmentImages: nextImages,
    });

    return applyQuiltCompatibilityHeaders(createSuccessResponse({ quilt: result.quilt }));
  } catch (error) {
    return createInternalErrorResponse('删除被子附件图片失败', error);
  }
}
