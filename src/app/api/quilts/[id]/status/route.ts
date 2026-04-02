import { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createConflictResponse,
  createInternalErrorResponse,
  createBadRequestResponse,
} from '@/lib/api/response';
import { sanitizeApiInput } from '@/lib/sanitization';
import { updateQuiltStatusWithUsageRecord } from '@/lib/data/quilts';

import { applyQuiltCompatibilityHeaders } from '../../_shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum(['IN_USE', 'STORAGE', 'MAINTENANCE'], {
    message: '无效的状态值',
  }),
  usageType: z
    .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
    .optional()
    .default('REGULAR'),
  notes: z.string().max(500, '备注不能超过500字符').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必须的');
    }

    const rawBody = await request.json();
    const body = sanitizeApiInput(rawBody);
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '状态数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { status, usageType, notes, startDate, endDate } = validationResult.data;
    const result = await updateQuiltStatusWithUsageRecord(id, status, usageType, notes, {
      startDate,
      endDate,
    });

    if (!result.quilt) {
      return createNotFoundResponse('被子');
    }

    return applyQuiltCompatibilityHeaders(
      createSuccessResponse({
        quilt: result.quilt,
        usageRecord: result.usageRecord || null,
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Quilt not found') {
        return createNotFoundResponse('被子');
      }
      if (error.message === 'Quilt already has an active usage record') {
        return createConflictResponse('该被子已有活跃的使用记录');
      }
    }

    return createInternalErrorResponse('更新被子状态失败', error);
  }
}
