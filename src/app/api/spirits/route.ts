import { NextRequest } from 'next/server';
import { createSpiritAction, getSpiritsAction } from '@/app/actions/spirits';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createSuccessResponse } from '@/lib/api/response';
import { sanitizeSearchQuery } from '@/lib/sanitization';
import type { SpiritSearchInput } from '@/modules/spirits/schema';

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

function parseSearchInput(request: NextRequest): SpiritSearchInput {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseNonNegativeInt(getStringParam(searchParams, 'limit'), 20), 100);
  const offset = parseNonNegativeInt(getStringParam(searchParams, 'offset'), 0);
  const allowedSortBy: NonNullable<SpiritSearchInput['sortBy']>[] = [
    'itemNumber',
    'name',
    'spiritType',
    'vintage',
    'age',
    'createdAt',
    'updatedAt',
  ];
  const sortByParam = getStringParam(searchParams, 'sortBy');
  const sortOrderParam = getStringParam(searchParams, 'sortOrder');
  const sortBy = allowedSortBy.includes(sortByParam as NonNullable<SpiritSearchInput['sortBy']>)
    ? (sortByParam as NonNullable<SpiritSearchInput['sortBy']>)
    : 'itemNumber';
  const sortOrder: NonNullable<SpiritSearchInput['sortOrder']> =
    sortOrderParam === 'desc' ? 'desc' : 'asc';
  const search = getStringParam(searchParams, 'search');
  const spiritType = getStringParam(searchParams, 'spiritType');
  const status = getStringParam(searchParams, 'status');
  const bottleStatus = getStringParam(searchParams, 'bottleStatus');
  const brand = getStringParam(searchParams, 'brand');
  const country = getStringParam(searchParams, 'country');
  const region = getStringParam(searchParams, 'region');
  const limitedEditionParam = getStringParam(searchParams, 'limitedEdition');
  const limitedEdition =
    limitedEditionParam === 'true' ? true : limitedEditionParam === 'false' ? false : undefined;

  return {
    filters: {
      ...(spiritType
        ? {
            spiritType: spiritType as NonNullable<SpiritSearchInput['filters']>['spiritType'],
          }
        : {}),
      ...(status
        ? {
            status: status as NonNullable<SpiritSearchInput['filters']>['status'],
          }
        : {}),
      ...(bottleStatus
        ? {
            bottleStatus: bottleStatus as NonNullable<SpiritSearchInput['filters']>['bottleStatus'],
          }
        : {}),
      ...(brand ? { brand } : {}),
      ...(country ? { country } : {}),
      ...(region ? { region } : {}),
      ...(limitedEdition !== undefined ? { limitedEdition } : {}),
      ...(search ? { search: sanitizeSearchQuery(search) } : {}),
    },
    sortBy,
    sortOrder,
    skip: offset,
    take: limit,
  } satisfies SpiritSearchInput;
}

export async function GET(request: NextRequest) {
  const searchInput = parseSearchInput(request);
  const result = await getSpiritsAction(searchInput);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  return createSuccessResponse(
    { spirits: result.data.spirits },
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
    await createSpiritAction(body as Parameters<typeof createSpiritAction>[0]),
    {
      status: 201,
      mapData: spirit => ({ spirit }),
    }
  );
}
