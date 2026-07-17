import { betterAuthInstance } from '@/auth';
import { createForbiddenResponse } from '@/lib/api/response';
import { toNextJsHandler } from 'better-auth/next-js';

const authHandlers = toNextJsHandler(betterAuthInstance);

export const { GET, PATCH, PUT, DELETE } = authHandlers;

function isPublicSignUpPath(pathname: string) {
  return pathname === '/api/auth/sign-up' || pathname.startsWith('/api/auth/sign-up/');
}

export async function POST(request: Request) {
  if (isPublicSignUpPath(new URL(request.url).pathname)) {
    return createForbiddenResponse(
      'Public registration is disabled. Ask an administrator to create the account.'
    );
  }

  return authHandlers.POST(request);
}
