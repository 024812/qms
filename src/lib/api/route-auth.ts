import { auth } from '@/auth';
import type { Session } from '@/auth';
import { createForbiddenResponse, createUnauthorizedResponse } from '@/lib/api/response';

type RouteAuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: ReturnType<typeof createUnauthorizedResponse> };

type RouteAdminResult =
  | { ok: true; session: Session }
  | {
      ok: false;
      response: ReturnType<typeof createUnauthorizedResponse | typeof createForbiddenResponse>;
    };

export async function requireApiSession(): Promise<RouteAuthResult> {
  const session = (await auth()) as Session | null;

  if (!session?.user?.id) {
    return { ok: false, response: createUnauthorizedResponse() };
  }

  return { ok: true, session };
}

export async function requireApiAdmin(): Promise<RouteAdminResult> {
  const sessionResult = await requireApiSession();

  if (!sessionResult.ok) {
    return sessionResult;
  }

  if (sessionResult.session.user.role !== 'admin') {
    return { ok: false, response: createForbiddenResponse() };
  }

  return sessionResult;
}
