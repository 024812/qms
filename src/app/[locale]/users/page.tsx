/**
 * User Management Page
 *
 * Admin-only page for managing system users.
 */

import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';
import { UserGuard } from './UserGuard';
import { connection } from 'next/server';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function UsersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Opt-in to dynamic rendering for auth check in UserGuard
  await connection();


  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <UserGuard />
    </Suspense>
  );
}

