import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getAntiqueAction } from '@/app/actions/antiques';
import { AntiqueDetail } from '@/modules/antiques/ui/AntiqueDetail';
import { AntiqueDetailActions } from '../_components/AntiqueDetailActions';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AntiqueDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  requirePageModuleAccess(await auth(), 'antiques');
  const t = await getTranslations({ locale, namespace: 'common' });

  const result = await getAntiqueAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <Link
          href="/antiques"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{result.data.name}</h1>
        <AntiqueDetailActions item={result.data} />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <AntiqueDetail item={result.data} />
      </div>
    </div>
  );
}
