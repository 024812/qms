'use server';

import { signOut } from '@/auth';

function normalizeRedirectPath(redirectTo?: string): string {
  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/login';
  }

  return redirectTo;
}

export async function logoutUser(redirectTo?: string) {
  await signOut({ redirectTo: normalizeRedirectPath(redirectTo) });
}
