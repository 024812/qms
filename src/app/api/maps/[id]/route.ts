import { NextRequest } from 'next/server';

import { deleteMapAction, getMapAction, updateMapAction } from '@/app/actions/maps';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await getMapAction(id);

  return actionResultToApiResponse(result, {
    mapData: map => ({ map }),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  const result = await updateMapAction({ ...(body as object), id });

  return actionResultToApiResponse(result, {
    mapData: map => ({ map }),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await deleteMapAction(id);

  return actionResultToApiResponse(result);
}
