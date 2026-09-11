import { NextRequest } from 'next/server';

import { deleteAntiqueAction, getAntiqueAction, updateAntiqueAction } from '@/app/actions/antiques';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createNotFoundResponse } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('文玩 ID 是必须的');
  }

  const result = await getAntiqueAction(id);

  if (!result.success) {
    return actionResultToApiResponse(result);
  }

  if (!result.data) {
    return createNotFoundResponse('文玩');
  }

  return actionResultToApiResponse(result, {
    mapData: antique => ({ antique }),
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('文玩 ID 是必须的');
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
    await updateAntiqueAction({ id, ...(body as Record<string, unknown>) }),
    {
      mapData: antique => ({ antique }),
    }
  );
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return createBadRequestResponse('文玩 ID 是必须的');
  }

  return actionResultToApiResponse(await deleteAntiqueAction(id), {
    mapData: data => ({ ...data }),
  });
}
