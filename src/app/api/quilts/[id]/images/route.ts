import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getQuiltAction, updateQuiltAction } from '@/app/actions/quilts';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createNotFoundResponse } from '@/lib/api/response';

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
  const { id } = await params;

  if (!id) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('被子 ID 是必须的'));
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return applyQuiltCompatibilityHeaders(
      createBadRequestResponse('Request body must be valid JSON')
    );
  }

  const validationResult = updateImagesSchema.safeParse(body);

  if (!validationResult.success) {
    return applyQuiltCompatibilityHeaders(
      actionResultToApiResponse({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '图片数据验证失败',
          fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
        },
      })
    );
  }

  const quiltResult = await getQuiltAction(id);

  if (!quiltResult.success) {
    return applyQuiltCompatibilityHeaders(actionResultToApiResponse(quiltResult));
  }

  if (!quiltResult.data) {
    return applyQuiltCompatibilityHeaders(createNotFoundResponse('被子'));
  }

  const { mainImage, attachmentImages } = validationResult.data;

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(
      await updateQuiltAction({
        id,
        ...(mainImage !== undefined ? { mainImage } : {}),
        ...(attachmentImages !== undefined ? { attachmentImages } : {}),
      }),
      {
        mapData: quilt => ({ quilt }),
      }
    )
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const imageIndexStr = searchParams.get('imageIndex');

  if (!id) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('被子 ID 是必须的'));
  }

  if (imageIndexStr === null) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('图片索引是必须的'));
  }

  const imageIndex = Number.parseInt(imageIndexStr, 10);
  const validationResult = deleteImageSchema.safeParse({ imageIndex });

  if (!validationResult.success) {
    return applyQuiltCompatibilityHeaders(
      actionResultToApiResponse({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '图片索引验证失败',
          fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
        },
      })
    );
  }

  const quiltResult = await getQuiltAction(id);

  if (!quiltResult.success) {
    return applyQuiltCompatibilityHeaders(actionResultToApiResponse(quiltResult));
  }

  if (!quiltResult.data) {
    return applyQuiltCompatibilityHeaders(createNotFoundResponse('被子'));
  }

  if (!quiltResult.data.attachmentImages || quiltResult.data.attachmentImages.length === 0) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('没有附件图片'));
  }

  if (imageIndex >= quiltResult.data.attachmentImages.length) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('无效的图片索引'));
  }

  const nextImages = [...quiltResult.data.attachmentImages];
  nextImages.splice(imageIndex, 1);

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(await updateQuiltAction({ id, attachmentImages: nextImages }), {
      mapData: quilt => ({ quilt }),
    })
  );
}
