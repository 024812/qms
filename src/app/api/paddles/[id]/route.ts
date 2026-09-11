import { NextRequest } from 'next/server';

import { deletePaddleAction, getPaddleAction, updatePaddleAction } from '@/app/actions/paddles';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPaddleAction(id);
  return actionResultToApiResponse(result);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updatePaddleAction({ id, ...body });
    return actionResultToApiResponse(result);
  } catch (error) {
    console.error('[API] PATCH /api/paddles/[id] error:', error);
    return createBadRequestResponse('Invalid JSON body');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deletePaddleAction(id);
  return actionResultToApiResponse(result);
}
