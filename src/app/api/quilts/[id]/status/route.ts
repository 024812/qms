import { NextRequest } from 'next/server';

import { changeQuiltStatusAction } from '@/app/actions/quilts';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

import { applyQuiltCompatibilityHeaders } from '../../_shared';

interface RouteParams {
  params: Promise<{ id: string }>;
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
      await changeQuiltStatusAction({
        quiltId: id,
        ...(body as Record<string, unknown>),
      } as Parameters<typeof changeQuiltStatusAction>[0]),
      {
        mapData: data => ({
          quilt: data.quilt,
          usageRecord: data.usageRecord,
        }),
      }
    )
  );
}
