import { NextRequest } from 'next/server';

import { deleteQuiltAction, getQuiltAction, updateQuiltAction } from '@/app/actions/quilts';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse, createNotFoundResponse } from '@/lib/api/response';

import { applyQuiltCompatibilityHeaders } from '../_shared';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('被子 ID 是必须的'));
  }

  const result = await getQuiltAction(id);

  if (!result.success) {
    return applyQuiltCompatibilityHeaders(actionResultToApiResponse(result));
  }

  if (!result.data) {
    return applyQuiltCompatibilityHeaders(createNotFoundResponse('被子'));
  }

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(result, {
      mapData: quilt => ({ quilt }),
    })
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('被子 ID 是必须的'));
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return applyQuiltCompatibilityHeaders(
      createBadRequestResponse('Request body must be valid JSON')
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return applyQuiltCompatibilityHeaders(
      createBadRequestResponse('Request body must be a JSON object')
    );
  }

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(
      await updateQuiltAction({ id, ...(body as Record<string, unknown>) }),
      {
        mapData: quilt => ({ quilt }),
      }
    )
  );
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return applyQuiltCompatibilityHeaders(createBadRequestResponse('被子 ID 是必须的'));
  }

  return applyQuiltCompatibilityHeaders(
    actionResultToApiResponse(await deleteQuiltAction(id), {
      mapData: data => ({ ...data, id }),
    })
  );
}
