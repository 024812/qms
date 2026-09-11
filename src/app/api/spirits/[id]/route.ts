import { NextRequest } from 'next/server';
import { getSpiritAction, updateSpiritAction, deleteSpiritAction } from '@/app/actions/spirits';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return actionResultToApiResponse(await getSpiritAction(id), {
    mapData: spirit => ({ spirit }),
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

  return actionResultToApiResponse(
    await updateSpiritAction(id, body as Parameters<typeof updateSpiritAction>[1]),
    {
      mapData: spirit => ({ spirit }),
    }
  );
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return actionResultToApiResponse(await deleteSpiritAction(id));
}
