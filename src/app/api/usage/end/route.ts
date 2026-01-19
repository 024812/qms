/**
 * End Usage Record REST API
 *
 * POST /api/usage/end - End an active usage record for a quilt
 *
 * Requirements: 1.2, 1.3 - REST API for usage records
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { endUsageRecord } from '@/lib/data/usage';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

// Input validation schema
const endUsageRecordSchema = z.object({
  quiltId: z.string().uuid('无效的被子ID'),
  endDate: z.string().transform(val => new Date(val)),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/usage/end
 *
 * End an active usage record for a quilt.
 *
 * Request Body:
 * - quiltId: string (required) - The quilt ID
 * - endDate: string (required) - End date in ISO format
 * - notes: string (optional) - Notes
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Sanitize input to prevent XSS (Requirements: 11.1)
    const body = sanitizeApiInput(rawBody);

    // Validate input using Zod schema
    const validationResult = endUsageRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '使用记录数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { quiltId, endDate, notes } = validationResult.data;

    // End the active usage record
    const record = await endUsageRecord(quiltId, endDate, notes || undefined);

    if (!record) {
      return createNotFoundResponse('该被子的活跃使用记录');
    }

    return createSuccessResponse({ record });
  } catch (error) {
    return createInternalErrorResponse('结束使用记录失败', error);
  }
}
