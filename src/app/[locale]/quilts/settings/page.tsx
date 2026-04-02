import { auth } from '@/auth';
import { getAppSettingsAction } from '@/app/actions/settings';

import { QuiltSettingsPageClient } from './_components/QuiltSettingsPageClient';

export default async function QuiltSettingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  let initialAppSettings = null;

  if (isAdmin) {
    const result = await getAppSettingsAction();
    if (result.success) {
      initialAppSettings = result.data;
    }
  }

  return <QuiltSettingsPageClient initialAppSettings={initialAppSettings} isAdmin={isAdmin} />;
}
