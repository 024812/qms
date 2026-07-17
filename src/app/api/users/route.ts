import { NextRequest } from 'next/server';

import { createUserAction, getUsersAction } from '@/app/actions/users';
import { actionResultToApiResponse } from '@/lib/api/action-response';
import { createBadRequestResponse } from '@/lib/api/response';

export async function GET() {
  return actionResultToApiResponse(await getUsersAction());
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createBadRequestResponse('Request body must be valid JSON');
  }

  return actionResultToApiResponse(await createUserAction(body), {
    status: 201,
  });
}
