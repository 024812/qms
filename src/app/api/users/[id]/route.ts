import { NextRequest } from 'next/server';

import { deleteUserAction, updateUserAction } from '@/app/actions/users';
import { actionResultToApiResponse } from '@/lib/api/action-response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return actionResultToApiResponse(
    await updateUserAction({
      ...(await request.json()),
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
