/**
 * Quilts REST API - Single Quilt Operations
 *
 * GET /api/quilts/[id] - Get a single quilt by ID
 * PUT /api/quilts/[id] - Update a quilt
 * DELETE /api/quilts/[id] - Delete a quilt
 *
 * Requirements: 1.2, 1.3 - REST API for quilts
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 */

import { NextRequest } from 'next/server';
import { getQuiltById, updateQuilt, deleteQuilt } from '@/lib/data/quilts';
import { updateQuiltSchema } from '@/lib/validations/quilt';
import { sanitizeApiInput } from '@/lib/sanitization';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
  createBadRequestResponse,
} from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/quilts/[id]
 *
 * Get a single quilt by ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必需的');
    }

    const quilt = await getQuiltById(id);

    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    return createSuccessResponse({ quilt });
  } catch (error) {
    return createInternalErrorResponse('获取被子详情失败', error);
  }
}

/**
 * PUT /api/quilts/[id]
 *
 * Update a quilt.
 *
 * Request Body: UpdateQuiltInput (partial)
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

    // Handle purchaseDate conversion if it's a string
    if (body.purchaseDate && typeof body.purchaseDate === 'string') {
      body.purchaseDate = new Date(body.purchaseDate);
    }

    // Validate input using Zod schema
    const validationResult = updateQuiltSchema.safeParse({ ...body, id });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '被子数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Check if quilt exists
    const existingQuilt = await getQuiltById(id);
    if (!existingQuilt) {
      return createNotFoundResponse('被子');
    }

    // Update the quilt (exclude id from data)
    const { id: _id, ...updateData } = validationResult.data;
    const quilt = await updateQuilt(id, updateData);

    if (!quilt) {
      return createNotFoundResponse('被子');
    }

    return createSuccessResponse({ quilt });
  } catch (error) {
    return createInternalErrorResponse('更新被子失败', error);
  }
}

/**
 * DELETE /api/quilts/[id]
 *
 * Delete a quilt and its related records.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return createBadRequestResponse('被子 ID 是必需的');
    }

    // Check if quilt exists
    const existingQuilt = await getQuiltById(id);
    if (!existingQuilt) {
      return createNotFoundResponse('被子');
    }

    const success = await deleteQuilt(id);

    if (!success) {
      return createNotFoundResponse('被子');
    }

    return createSuccessResponse({ deleted: true, id });
  } catch (error) {
    return createInternalErrorResponse('删除被子失败', error);
  }
}
