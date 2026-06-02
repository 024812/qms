'use server';

import { betterAuthInstance } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

function normalizeRedirectPath(redirectTo?: string): string {
  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return '/login';
  }

  return redirectTo;
}

export async function logoutUser(redirectTo?: string) {
  await betterAuthInstance.api.signOut({
    headers: await headers(),
  });

  redirect(normalizeRedirectPath(redirectTo));
}
