import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';

import { auth } from '@/auth';
import { listUsers } from '@/lib/data/users';

import { UsersPageClient } from './_components/UsersPageClient';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function UsersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId || session?.user?.role !== 'admin') {
    redirect({ href: '/', locale });
  }

  const initialUsers = await listUsers();

  return <UsersPageClient currentUserId={currentUserId!} initialUsers={initialUsers} />;
}
