import { NextRequest } from 'next/server';

import { countQuilts, getQuilts, saveQuilt } from '@/lib/data/quilts';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
  createCreatedResponse,
} from '@/lib/api/response';
import { sanitizeApiInput, sanitizeSearchQuery } from '@/lib/sanitization';
import { createQuiltSchema, quiltFiltersSchema } from '@/lib/validations/quilt';

import { applyQuiltCompatibilityHeaders } from './_shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

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

    const [quilts, total] = await Promise.all([getQuilts(filters), countQuilts(filters)]);

    return applyQuiltCompatibilityHeaders(
      createSuccessResponse(
        { quilts },
        {
          total,
          limit,
          hasMore: offset + quilts.length < total,
        }
      )
    );
  } catch (error) {
    return createInternalErrorResponse('获取被子列表失败', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeApiInput(rawBody);

    if (body.purchaseDate && typeof body.purchaseDate === 'string') {
      body.purchaseDate = new Date(body.purchaseDate);
    }

    const validationResult = createQuiltSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '被子数据验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const result = await saveQuilt(validationResult.data);

    return applyQuiltCompatibilityHeaders(createCreatedResponse({ quilt: result.quilt }));
  } catch (error) {
    return createInternalErrorResponse('创建被子失败', error);
  }
}
