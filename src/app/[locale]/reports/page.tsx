import { connection } from 'next/server';

import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';

import { ReportsPageClient } from './_components/ReportsPageClient';

export default async function ImportExportPage() {
  await connection();

  const session = requirePageModuleAccess(await auth(), 'quilts');

  return <ReportsPageClient isAdmin={session.user.role === 'admin'} />;
}
