/**
 * End-usage HTTP compatibility route.
 *
 * Internal app flows use the DAL + server action path. This route remains as
 * an external HTTP surface for ending an active usage record.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getActiveUsageRecord, updateUsageRecord } from '@/lib/data/usage';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createBadRequestResponse,
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';
import { requireApiSession } from '@/lib/api/route-auth';

// Input validation schema
const endUsageRecordSchema = z.object({
  quiltId: z.string().trim().min(1, '无效的被子ID'),
  endDate: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
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
    const authResult = await requireApiSession();
    if (!authResult.ok) return authResult.response;

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

    // Get active usage record
    const activeRecord = await getActiveUsageRecord(quiltId);

    if (!activeRecord) {
      return createNotFoundResponse('该被子的活跃使用记录');
    }

    if (endDate < activeRecord.startDate) {
      return createValidationErrorResponse('使用记录数据验证失败', {
        endDate: ['结束日期不能早于开始日期'],
      });
    }

    // End the usage record
    const record = await updateUsageRecord(activeRecord.id, {
      endDate,
      notes: notes || undefined, // Only update notes if provided
    });

    if (!record) {
      return createInternalErrorResponse('更新使用记录失败');
    }

    return createSuccessResponse({ record });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createBadRequestResponse('Request body must be valid JSON');
    }
    return createInternalErrorResponse('结束使用记录失败', error);
  }
}
