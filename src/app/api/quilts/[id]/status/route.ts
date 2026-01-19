/**
 * Quilts REST API - Status Change
 *
 * PUT /api/quilts/[id]/status - Update quilt status with automatic usage record management
 *
 * Requirements: 1.2, 1.3 - REST API for quilts
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 * Requirements: 13.1 - Status change atomicity
 * Requirements: 13.2 - Single active usage record
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { updateQuiltStatusWithUsageRecord } from '@/lib/data/quilts';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createConflictResponse,
  createInternalErrorResponse,
  createBadRequestResponse,
} from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Validation schema for status update
const updateStatusSchema = z.object({
  status: z.enum(['IN_USE', 'STORAGE', 'MAINTENANCE'], {
    message: '无效的状态值',
  }),
  usageType: z
    .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
    .optional()
    .default('REGULAR'),
  notes: z.string().max(500, '备注不能超过500字符').optional(),
});

/**
 * PUT /api/quilts/[id]/status
 *
 * Update quilt status with automatic usage record management.
 *
 * When changing TO IN_USE: Creates a new usage record with start_date
 * When changing FROM IN_USE: Ends the active usage record with end_date
 *
 * Request Body:
 * - status: 'IN_USE' | 'STORAGE' | 'MAINTENANCE'
 * - usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION'
 * - notes?: string
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
    const validationResult = updateStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '状态数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { status, usageType, notes } = validationResult.data;

    // Update status with atomic usage record management
    const result = await updateQuiltStatusWithUsageRecord(id, status, usageType, notes);

    if (!result.quilt) {
      return createNotFoundResponse('被子');
    }

    // Return the updated quilt and usage record info
    return createSuccessResponse({
      quilt: result.quilt,
      usageRecord: result.usageRecord || null,
    });
  } catch (error) {
    // Handle specific error cases
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
