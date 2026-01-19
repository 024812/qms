/**
 * Usage Record REST API - Single Record Operations
 *
 * GET /api/usage/[id] - Get a single usage record
 * PUT /api/usage/[id] - Update a usage record
 * DELETE /api/usage/[id] - Delete a usage record
 *
 * Requirements: 1.2, 1.3 - REST API for usage records
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUsageRecordById, updateUsageRecord, deleteUsageRecord } from '@/lib/data/usage';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

// Input validation schema for updates
const updateUsageRecordSchema = z.object({
  startDate: z
    .string()
    .transform(val => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform(val => new Date(val))
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/usage/[id]
 *
 * Get a single usage record by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const record = await getUsageRecordById(id);

    if (!record) {
      return createNotFoundResponse('使用记录');
    }

    return createSuccessResponse({ record });
  } catch (error) {
    return createInternalErrorResponse('获取使用记录失败', error);
  }
}

/**
 * PUT /api/usage/[id]
 *
 * Update a usage record.
 *
 * Request Body:
 * - startDate: string (optional) - Start date in ISO format
 * - endDate: string (optional) - End date in ISO format
 * - notes: string (optional) - Notes
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const rawBody = await request.json();

    // Sanitize input to prevent XSS (Requirements: 11.1)
    const body = sanitizeApiInput(rawBody);

    // Validate input using Zod schema
    const validationResult = updateUsageRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '使用记录数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Check if record exists
    const existingRecord = await getUsageRecordById(id);
    if (!existingRecord) {
      return createNotFoundResponse('使用记录');
    }

    // Update the record
    const record = await updateUsageRecord(id, validationResult.data);

    if (!record) {
      return createNotFoundResponse('使用记录');
    }

    return createSuccessResponse({ record });
  } catch (error) {
    return createInternalErrorResponse('更新使用记录失败', error);
  }
}

/**
 * DELETE /api/usage/[id]
 *
 * Delete a usage record.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if record exists
    const existingRecord = await getUsageRecordById(id);
    if (!existingRecord) {
      return createNotFoundResponse('使用记录');
    }

    // Delete the record
    const success = await deleteUsageRecord(id);

    if (!success) {
      return createNotFoundResponse('使用记录');
    }

    return createSuccessResponse({ deleted: true, id });
  } catch (error) {
    return createInternalErrorResponse('删除使用记录失败', error);
  }
}
