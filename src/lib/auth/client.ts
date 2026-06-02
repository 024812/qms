'use client';

import { createAuthClient } from 'better-auth/react';
import { customSessionClient } from 'better-auth/client/plugins';

import type { betterAuthInstance } from '@/auth';

export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [customSessionClient<typeof betterAuthInstance>()],
});

export const useSession = authClient.useSession;
