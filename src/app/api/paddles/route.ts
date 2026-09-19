import { NextRequest } from 'next/server';

import { createPaddleAction, getPaddlesAction } from '@/app/actions/paddles';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createSuccessResponse } from '@/lib/api/response';
import { sanitizeSearchQuery } from '@/lib/sanitization';
import type { PaddleSearchInput } from '@/app/actions/paddles';

function getStringParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value && value.trim() !== '' ? value : undefined;
}

function parseNonNegativeInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseSearchInput(request: NextRequest): PaddleSearchInput {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseNonNegativeInt(getStringParam(searchParams, 'limit'), 20), 100);
  const offset = parseNonNegativeInt(getStringParam(searchParams, 'offset'), 0);

  const allowedSortBy: NonNullable<PaddleSearchInput['sortBy']>[] = [
    'itemNumber',
    'name',
    'bladeBrand',
    'bladeWeightG',
    'createdAt',
    'updatedAt',
  ];

  const sortByParam = getStringParam(searchParams, 'sortBy');
  const sortOrderParam = getStringParam(searchParams, 'sortOrder');
  const sortBy = allowedSortBy.includes(sortByParam as NonNullable<PaddleSearchInput['sortBy']>)
    ? (sortByParam as NonNullable<PaddleSearchInput['sortBy']>)
    : 'itemNumber';
  const sortOrder: NonNullable<PaddleSearchInput['sortOrder']> =
    sortOrderParam === 'desc' ? 'desc' : 'asc';

  const search = getStringParam(searchParams, 'search');
  const status = getStringParam(searchParams, 'status');
  const bladeBrand = getStringParam(searchParams, 'bladeBrand');
  const handleType = getStringParam(searchParams, 'handleType');

  return {
    filters: {
      ...(status
        ? {
            status: status as NonNullable<PaddleSearchInput['filters']>['status'],
          }
        : {}),
      ...(bladeBrand ? { bladeBrand } : {}),
      ...(handleType
        ? {
            handleType: handleType as NonNullable<PaddleSearchInput['filters']>['handleType'],
          }
        : {}),
      ...(search ? { search: sanitizeSearchQuery(search) } : {}),
    },
    sortBy,
    sortOrder,
    skip: offset,
    take: limit,
  } satisfies PaddleSearchInput;
}

export async function GET(request: NextRequest) {
  const searchInput = parseSearchInput(request);
  const result = await getPaddlesAction(searchInput);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  return createSuccessResponse(
    {
      paddles: result.data.paddles,
      pagination: {
        total: result.data.total,
        offset: searchInput.skip || 0,
        limit: searchInput.take || 20,
        hasMore: result.data.hasMore,
      },
    },
    {
      total: result.data.total,
      limit: searchInput.take,
      hasMore: result.data.hasMore,
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createPaddleAction(body);

    if (!result.success) {
      return actionResultToApiResponse(result);
    }

    return actionResultToApiResponse(result, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/paddles error:', error);
    return createBadRequestResponse('Invalid JSON body');
  }
}
