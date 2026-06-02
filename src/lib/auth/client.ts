'use client';

import { createAuthClient } from 'better-auth/react';
import { customSessionClient } from 'better-auth/client/plugins';

import type { betterAuthInstance } from '@/auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  basePath: '/api/auth',
  plugins: [customSessionClient<typeof betterAuthInstance>()],
});

export const useSession = authClient.useSession;
