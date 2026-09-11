import { NextRequest } from 'next/server';

import { createAntiqueAction, getAntiquesAction } from '@/app/actions/antiques';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createSuccessResponse } from '@/lib/api/response';
import { sanitizeSearchQuery } from '@/lib/sanitization';
import type { AntiqueSortField, SortOrder } from '@/lib/data/antiques';
import type { AntiqueCategory, AntiqueStatus } from '@/modules/antiques/schema';

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

function parseNonNegativeFloat(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseSearchInput(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseNonNegativeInt(getStringParam(searchParams, 'limit'), 20), 100);
  const offset = parseNonNegativeInt(getStringParam(searchParams, 'offset'), 0);
  const allowedSortBy: AntiqueSortField[] = [
    'itemNumber',
    'name',
    'category',
    'currentValue',
    'createdAt',
    'updatedAt',
  ];
  const sortByParam = getStringParam(searchParams, 'sortBy');
  const sortOrderParam = getStringParam(searchParams, 'sortOrder');
  const sortBy: AntiqueSortField = allowedSortBy.includes(sortByParam as AntiqueSortField)
    ? (sortByParam as AntiqueSortField)
    : 'itemNumber';
  const sortOrder: SortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';
  const search = getStringParam(searchParams, 'search');
  const category = getStringParam(searchParams, 'category');
  const status = getStringParam(searchParams, 'status');
  const era = getStringParam(searchParams, 'era');
  const dynasty = getStringParam(searchParams, 'dynasty');
  const minValue = parseNonNegativeFloat(getStringParam(searchParams, 'minValue'));
  const maxValue = parseNonNegativeFloat(getStringParam(searchParams, 'maxValue'));

  return {
    category: category ? (category as AntiqueCategory) : undefined,
    status: status ? (status as AntiqueStatus) : undefined,
    era,
    dynasty,
    search: search ? sanitizeSearchQuery(search) : undefined,
    minValue,
    maxValue,
    limit,
    offset,
    sortBy,
    sortOrder,
  };
}

export async function GET(request: NextRequest) {
  const filters = parseSearchInput(request);
  const result = await getAntiquesAction(filters);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  return createSuccessResponse(
    { antiques: result.data.antiques },
    {
      total: result.data.total,
      limit: filters.limit,
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

  return actionResultToApiResponse(await createAntiqueAction(body), {
    status: 201,
    mapData: antique => ({ antique }),
  });
}
