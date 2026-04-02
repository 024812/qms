import { NextRequest } from 'next/server';

import { createQuiltAction, getQuiltsAction } from '@/app/actions/quilts';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createSuccessResponse } from '@/lib/api/response';
import { sanitizeSearchQuery } from '@/lib/sanitization';
import type { QuiltSearchInput } from '@/lib/validations/quilt';

import { applyQuiltCompatibilityHeaders } from './_shared';

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

function parseSearchInput(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseNonNegativeInt(getStringParam(searchParams, 'limit'), 20), 100);
  const offset = parseNonNegativeInt(getStringParam(searchParams, 'offset'), 0);
  const allowedSortBy: NonNullable<QuiltSearchInput['sortBy']>[] = [
    'itemNumber',
    'name',
    'season',
    'weightGrams',
    'createdAt',
    'updatedAt',
  ];
  const sortByParam = getStringParam(searchParams, 'sortBy');
  const sortOrderParam = getStringParam(searchParams, 'sortOrder');
  const sortBy = allowedSortBy.includes(sortByParam as NonNullable<QuiltSearchInput['sortBy']>)
    ? (sortByParam as NonNullable<QuiltSearchInput['sortBy']>)
    : 'itemNumber';
  const sortOrder: NonNullable<QuiltSearchInput['sortOrder']> =
    sortOrderParam === 'desc' ? 'desc' : 'asc';
  const search = getStringParam(searchParams, 'search');
  const season = getStringParam(searchParams, 'season');
  const status = getStringParam(searchParams, 'status');
  const location = getStringParam(searchParams, 'location');
  const brand = getStringParam(searchParams, 'brand');

  return {
    filters: {
      ...(season
        ? {
            season: season as NonNullable<QuiltSearchInput['filters']>['season'],
          }
        : {}),
      ...(status
        ? {
            status: status as NonNullable<QuiltSearchInput['filters']>['status'],
          }
        : {}),
      ...(location ? { location } : {}),
      ...(brand ? { brand } : {}),
      ...(search ? { search: sanitizeSearchQuery(search) } : {}),
    },
    sortBy,
    sortOrder,
    skip: offset,
    take: limit,
  } satisfies QuiltSearchInput;
}

export async function GET(request: NextRequest) {
  const searchInput = parseSearchInput(request);
  const result = await getQuiltsAction(searchInput);

  if (!result.success) {
    return applyQuiltCompatibilityHeaders(actionResultToApiResponse(result));
  }

  return applyQuiltCompatibilityHeaders(
    createSuccessResponse(
      { quilts: result.data.quilts },
      {
        total: result.data.total,
        limit: searchInput.take,
        hasMore: result.data.hasMore,
      }
    )
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return applyQuiltCompatibilityHeaders(
      createBadRequestResponse('Request body must be valid JSON')
    );
  }

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(
      await createQuiltAction(body as Parameters<typeof createQuiltAction>[0]),
      {
        status: 201,
        mapData: quilt => ({ quilt }),
      }
    )
  );
}
