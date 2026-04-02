import { auth } from '@/auth';
import { getCardSettingsAction, type CardSettings } from '@/app/actions/cards';

import { CardSettingsPageClient } from './_components/CardSettingsPageClient';

export default async function CardSettingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  let initialSettings: CardSettings | null = null;

  if (isAdmin) {
    const result = await getCardSettingsAction();

    if (result.success) {
      initialSettings = result.data;
    }
  }

  return <CardSettingsPageClient initialSettings={initialSettings} isAdmin={isAdmin} />;
}
