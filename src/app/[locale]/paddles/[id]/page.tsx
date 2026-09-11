import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getPaddleAction } from '@/app/actions/paddles';
import { PaddleDetail } from '@/modules/paddles/ui/PaddleDetail';
import { PaddleDetailActions } from '../_components/PaddleDetailActions';

export default async function PaddleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  requirePageModuleAccess(await auth(), 'paddles');
  const t = await getTranslations({ locale, namespace: 'common' });

  const result = await getPaddleAction(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/paddles" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <PaddleDetail item={result.data} />
      </div>

      <div className="mt-6">
        <PaddleDetailActions item={result.data} />
      </div>
    </div>
  );
}
