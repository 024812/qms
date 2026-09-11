'use server';

import { betterAuthInstance } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { normalizeInternalRedirect } from '@/lib/redirect-validation';

function normalizeRedirectPath(redirectTo?: string): string {
  return normalizeInternalRedirect(redirectTo, '/login');
}

export async function logoutUser(redirectTo?: string) {
  await betterAuthInstance.api.signOut({
    headers: await headers(),
  });

  redirect(normalizeRedirectPath(redirectTo));
}
