/**
 * Quilts REST API - List and Create
 *
 * GET /api/quilts - Get all quilts with filtering and pagination
 * POST /api/quilts - Create a new quilt
 *
 * Requirements: 1.2, 1.3 - REST API for quilts
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 11.1 - Input sanitization
 */

import { NextRequest } from 'next/server';
import { getQuilts, countQuilts, createQuilt } from '@/lib/data/quilts';
import { createQuiltSchema, quiltFiltersSchema } from '@/lib/validations/quilt';
import { sanitizeApiInput, sanitizeSearchQuery } from '@/lib/sanitization';
import {
  createValidationErrorResponse,
  createInternalErrorResponse,
  createSuccessResponse,
  createCreatedResponse,
} from '@/lib/api/response';

/**
 * GET /api/quilts
 *
 * Get all quilts with optional filtering and pagination.
 *
 * Query Parameters:
 * - season: Filter by season (WINTER, SPRING_AUTUMN, SUMMER)
 * - status: Filter by status (IN_USE, MAINTENANCE, STORAGE)
 * - location: Filter by location (partial match)
 * - brand: Filter by brand (partial match)
 * - search: Search across name, color, fill material, notes
 * - limit: Number of results per page (default: 20, max: 100)
 * - offset: Number of results to skip (default: 0)
 * - sortBy: Sort field (itemNumber, name, season, weightGrams, createdAt, updatedAt)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and sanitize query parameters
    const season = searchParams.get('season') || undefined;
    const status = searchParams.get('status') || undefined;
    const location = searchParams.get('location') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const search = searchParams.get('search')
      ? sanitizeSearchQuery(searchParams.get('search'))
      : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'itemNumber';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validate filters using Zod schema
    const filtersResult = quiltFiltersSchema.safeParse({
      season,
      status,
      location,
      brand,
      search,
    });

    if (!filtersResult.success) {
      return createValidationErrorResponse(
        '过滤参数无效',
        filtersResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Build filters object
    const filters = {
      ...filtersResult.data,
      limit,
      offset,
      sortBy: sortBy as
        | 'itemNumber'
        | 'name'
        | 'season'
        | 'weightGrams'
        | 'createdAt'
        | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    // Fetch quilts and count
    const [quilts, total] = await Promise.all([getQuilts(filters), countQuilts(filters)]);

    return createSuccessResponse(
      { quilts },
      {
        total,
        limit,
        hasMore: offset + quilts.length < total,
      }
    );
  } catch (error) {
    return createInternalErrorResponse('获取被子列表失败', error);
  }
}

/**
 * POST /api/quilts
 *
 * Create a new quilt.
 *
 * Request Body: CreateQuiltInput
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Sanitize input to prevent XSS (Requirements: 11.1)
    const body = sanitizeApiInput(rawBody);

    // Handle purchaseDate conversion if it's a string
    if (body.purchaseDate && typeof body.purchaseDate === 'string') {
      body.purchaseDate = new Date(body.purchaseDate);
    }

    // Validate input using Zod schema
    const validationResult = createQuiltSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '被子数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Create the quilt
    const quilt = await createQuilt(validationResult.data);

    return createCreatedResponse({ quilt });
  } catch (error) {
    return createInternalErrorResponse('创建被子失败', error);
  }
}
