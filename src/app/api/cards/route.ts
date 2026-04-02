import { NextRequest } from 'next/server';

import { getCardsAction, saveCardAction, type GetCardsActionInput } from '@/app/actions/cards';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

function getStringParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value && value.trim() !== '' ? value : undefined;
}

function parsePositiveInt(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function buildCardsActionInput(request: NextRequest): GetCardsActionInput {
  const { searchParams } = new URL(request.url);
  const sport = getStringParam(searchParams, 'sport');
  const gradingCompany = getStringParam(searchParams, 'gradingCompany');
  const status = getStringParam(searchParams, 'status');
  const page = parsePositiveInt(getStringParam(searchParams, 'page'));
  const pageSize = parsePositiveInt(getStringParam(searchParams, 'pageSize'));
  const includeSold = parseBoolean(getStringParam(searchParams, 'includeSold'));

  const filter: NonNullable<GetCardsActionInput['filter']> = {};

  if (sport) {
    filter.sport = sport as NonNullable<GetCardsActionInput['filter']>['sport'];
  }

  if (gradingCompany) {
    filter.gradingCompany = gradingCompany as NonNullable<
      GetCardsActionInput['filter']
    >['gradingCompany'];
  }

  if (status) {
    filter.status = status as NonNullable<GetCardsActionInput['filter']>['status'];
  }

  const hasExplicitQuery =
    searchParams.size > 0 ||
    sport !== undefined ||
    gradingCompany !== undefined ||
    status !== undefined ||
    page !== undefined ||
    pageSize !== undefined ||
    includeSold !== undefined;

  return {
    search: getStringParam(searchParams, 'search'),
    ...(Object.keys(filter).length > 0 ? { filter } : {}),
    ...(page !== undefined ? { page } : hasExplicitQuery ? { page: 1 } : {}),
    ...(pageSize !== undefined ? { pageSize } : hasExplicitQuery ? {} : { pageSize: 1000 }),
    ...(includeSold !== undefined
      ? { includeSold }
      : hasExplicitQuery
        ? {}
        : { includeSold: true }),
  };
}

export async function GET(request: NextRequest) {
  const result = await getCardsAction(buildCardsActionInput(request));

  return actionResultToApiResponse(result, {
    mapData: data => ({
      cards: data.items,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
    }),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  return actionResultToApiResponse(await saveCardAction(body), {
    status: 201,
    mapData: data => data,
  });
}
