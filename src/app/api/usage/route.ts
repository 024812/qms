/**
 * Usage Records HTTP compatibility route.
 *
 * Internal app flows use the DAL + server action path. This route remains as
 * an external HTTP surface for list/create operations.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createUsageRecord as createUsageRecordData,
  getUsageRecordsWithQuilts,
} from '@/lib/data/usage';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createBadRequestResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createCreatedResponse,
} from '@/lib/api/response';
import { requireApiSession } from '@/lib/api/route-auth';

// Input validation schemas
const createUsageRecordSchema = z
  .object({
    quiltId: z.string().trim().min(1, '无效的被子ID'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    usageType: z
      .enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION'])
      .default('REGULAR'),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(input => !input.endDate || input.endDate >= input.startDate, {
    message: '结束日期不能早于开始日期',
    path: ['endDate'],
  });

/**
 * GET /api/usage
 *
 * Get all usage records with optional filtering and pagination.
 *
 * Query Parameters:
 * - quiltId: Filter by quilt ID
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiSession();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const quiltId = searchParams.get('quiltId') || undefined;
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const requestedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;

    // Fetch usage records with quilt join (returns startedAt/endedAt format)
    // Uses 'use cache' for server-side caching
    const records = await getUsageRecordsWithQuilts({ quiltId, limit, offset });

    const response = createSuccessResponse(
      { records },
      {
        total: records.length,
        limit,
        hasMore: records.length === limit,
      }
    );

    // Prevent browser caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return response;
  } catch (error) {
    return createInternalErrorResponse('获取使用记录列表失败', error);
  }
}

/**
 * POST /api/usage
 *
 * Create a new usage record.
 *
 * Request Body:
 * - quiltId: string (required) - The quilt ID
 * - startDate: string (required) - Start date in ISO format
 * - endDate: string (optional) - End date in ISO format
 * - usageType: string (optional) - Usage type (REGULAR, GUEST, SPECIAL_OCCASION, SEASONAL_ROTATION)
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
    const validationResult = createUsageRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '使用记录数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { quiltId, startDate, endDate, usageType, notes } = validationResult.data;

    // Create the usage record
    const record = await createUsageRecordData({
      quiltId,
      startDate,
      endDate,
      usageType,
      notes,
    });

    return createCreatedResponse({ record });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createBadRequestResponse('Request body must be valid JSON');
    }
    return createInternalErrorResponse('创建使用记录失败', error);
  }
}
