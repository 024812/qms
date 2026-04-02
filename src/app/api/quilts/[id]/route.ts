import { NextRequest } from 'next/server';

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
  createBadRequestResponse,
} from '@/lib/api/response';
import { getQuiltById, saveQuilt, deleteQuilt } from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';
import { updateQuiltSchema } from '@/lib/validations/quilt';

import { applyQuiltCompatibilityHeaders } from '../_shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必须的');
    }

    const quilt = await getQuiltById(id);

    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    return applyQuiltCompatibilityHeaders(createSuccessResponse({ quilt }));
  } catch (error) {
    return createInternalErrorResponse('获取被子详情失败', error);
  }
}

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

    if (body.purchaseDate && typeof body.purchaseDate === 'string') {
      body.purchaseDate = new Date(body.purchaseDate);
    }

    const validationResult = updateQuiltSchema.safeParse({ ...body, id });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '被子数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const existingQuilt = await getQuiltById(id);
    if (!existingQuilt) {
      return createNotFoundResponse('被子');
    }

    const result = await saveQuilt(validationResult.data);

    return applyQuiltCompatibilityHeaders(createSuccessResponse({ quilt: result.quilt }));
  } catch (error) {
    return createInternalErrorResponse('更新被子失败', error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必须的');
    }

    const existingQuilt = await getQuiltById(id);
    if (!existingQuilt) {
      return createNotFoundResponse('被子');
    }

    const success = await deleteQuilt(id);

    if (!success) {
      return createNotFoundResponse('被子');
    }

    return applyQuiltCompatibilityHeaders(createSuccessResponse({ deleted: true, id }));
  } catch (error) {
    return createInternalErrorResponse('删除被子失败', error);
  }
}
