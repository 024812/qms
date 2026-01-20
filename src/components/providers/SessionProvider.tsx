/**
 * Session Provider Component
 * 
 * Wraps the application with NextAuth.js SessionProvider to enable
 * client-side session access via useSession hook.
 * 
 * Best Practice (Next.js 16 + NextAuth.js v5):
 * - SessionProvider should be a separate client component
 * - Imported and used directly in root layout
 * - Enables useSession hook in all client components
 * - Configured with refetchInterval to keep session fresh
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch session when window regains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
