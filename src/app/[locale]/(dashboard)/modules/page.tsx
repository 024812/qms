/**
 * Module Selector Page
 * 
 * Displays all available modules and allows users to subscribe/unsubscribe.
 * 
 * Requirements: 5.1, 8.2
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ModuleSelector } from './ModuleSelector';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';


export default async function ModulesPage() {
  // Opt-in to dynamic rendering for auth check
  await connection();
  
  const session = await auth();


  if (!session?.user) {
    redirect('/login');
  }

  const t = await getTranslations('modules');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <ModuleSelector />
      </div>
    </div>
  );
}
