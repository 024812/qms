import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getSpiritAction } from '@/app/actions/spirits';
import { SpiritDetail } from '@/modules/spirits/ui/SpiritDetail';
import { spiritToSpiritItem } from '@/modules/spirits/schema';
import { SpiritDetailActions } from '../_components/SpiritDetailActions';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  requirePageModuleAccess(await auth(), 'spirits');
  const t = await getTranslations({ locale, namespace: 'spirits' });

  const result = await getSpiritAction(id);

  if (!result.success) {
    return {
      title: `${t('notFound')} - QMS`,
    };
  }

  return {
    title: `${result.data.name} - ${t('title')} - QMS`,
  };
}

export default async function SpiritDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  requirePageModuleAccess(await auth(), 'spirits');
  const t = await getTranslations({ locale, namespace: 'common' });

  const result = await getSpiritAction(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/spirits"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToList')}
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow">
          <SpiritDetail item={spiritToSpiritItem(result.data)} />
        </div>

        <SpiritDetailActions item={result.data} />
      </div>
    </div>
  );
}
