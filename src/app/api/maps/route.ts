import { NextRequest } from 'next/server';

import { createMapAction, getMapsAction } from '@/app/actions/maps';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createSuccessResponse } from '@/lib/api/response';
import { sanitizeSearchQuery } from '@/lib/sanitization';
import type { MapType, MapStatus, MapMaterial } from '@/modules/maps/schema';

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

  const allowedSortBy = [
    'itemNumber',
    'name',
    'mapType',
    'publishedYear',
    'createdAt',
    'updatedAt',
  ] as const;

  const sortByParam = getStringParam(searchParams, 'sortBy');
  const sortOrderParam = getStringParam(searchParams, 'sortOrder');
  const sortBy = allowedSortBy.includes(sortByParam as (typeof allowedSortBy)[number])
    ? (sortByParam as (typeof allowedSortBy)[number])
    : 'itemNumber';
  const sortOrder: 'asc' | 'desc' = sortOrderParam === 'desc' ? 'desc' : 'asc';

  const search = getStringParam(searchParams, 'search');
  const mapType = getStringParam(searchParams, 'mapType');
  const status = getStringParam(searchParams, 'status');
  const material = getStringParam(searchParams, 'material');
  const region = getStringParam(searchParams, 'region');
  const country = getStringParam(searchParams, 'country');

  return {
    filters: {
      ...(mapType ? { mapType: mapType as MapType } : {}),
      ...(status ? { status: status as MapStatus } : {}),
      ...(material ? { material: material as MapMaterial } : {}),
      ...(region ? { region } : {}),
      ...(country ? { country } : {}),
      ...(search ? { search: sanitizeSearchQuery(search) } : {}),
    },
    sortBy,
    sortOrder,
    skip: offset,
    take: limit,
  };
}

export async function GET(request: NextRequest) {
  const searchInput = parseSearchInput(request);
  const result = await getMapsAction(searchInput);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  return createSuccessResponse(
    { maps: result.data.maps },
    {
      total: result.data.total,
      limit: searchInput.take,
      hasMore: result.data.hasMore,
    }
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  return actionResultToApiResponse(
    await createMapAction(body as Parameters<typeof createMapAction>[0]),
    {
      status: 201,
      mapData: map => ({ map }),
    }
  );
}
