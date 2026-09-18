import { NextRequest } from 'next/server';

import { deleteCardAction, getCardAction, updateCardAction } from '@/app/actions/cards';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createNotFoundResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('Card ID is required');
  }

  const result = await getCardAction(id);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  if (!result.data) {
    return createNotFoundResponse('Card');
  }

  return actionResultToApiResponse(result, {
    mapData: card => ({ card }),
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('Card ID is required');
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return createBadRequestResponse('Request body must be a JSON object');
  }

  return actionResultToApiResponse(
    await updateCardAction({ ...(body as Record<string, unknown>), id }),
    {
      mapData: data => data,
    }
  );
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('Card ID is required');
  }

  return actionResultToApiResponse(await deleteCardAction(id));
}
