import { NextRequest } from 'next/server';

import { deleteUserAction, updateUserAction } from '@/app/actions/users';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    await updateUserAction({
      ...(body as Record<string, unknown>),
      id,
    })
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return actionResultToApiResponse(await deleteUserAction({ id }));
}
