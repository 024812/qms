import { NextRequest } from 'next/server';

import { createUserAction, getUsersAction } from '@/app/actions/users';
import { actionResultToApiResponse } from '@/lib/api/action-response';

export async function GET() {
  return actionResultToApiResponse(await getUsersAction());
}

export async function POST(request: NextRequest) {
  return actionResultToApiResponse(await createUserAction(await request.json()), {
    status: 201,
  });
}
