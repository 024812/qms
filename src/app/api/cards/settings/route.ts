import { NextRequest } from 'next/server';

import { getCardSettingsAction, updateCardSettingsAction } from '@/app/actions/cards';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

export async function GET() {
  return actionResultToApiResponse(await getCardSettingsAction(), {
    mapData: settings => ({ settings }),
  });
}

export async function PUT(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  return actionResultToApiResponse(await updateCardSettingsAction(body), {
    mapData: () => ({ updated: true }),
  });
}
