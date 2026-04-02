import { NextRequest } from 'next/server';

import { getCardSettingsAction, updateCardSettingsAction } from '@/app/actions/cards';
import { actionResultToApiResponse } from '@/lib/api/action-response';

export async function GET() {
  return actionResultToApiResponse(await getCardSettingsAction(), {
    mapData: settings => ({ settings }),
  });
}

export async function PUT(request: NextRequest) {
  return actionResultToApiResponse(await updateCardSettingsAction(await request.json()), {
    mapData: () => ({ updated: true }),
  });
}
