import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getMapAction } from '@/app/actions/maps';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { MapDetail } from '@/modules/maps/ui/MapDetail';
import { mapToMapItem } from '@/modules/maps/schema';
import { MapDetailActions } from '../_components/MapDetailActions';

interface MapDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function MapDetailPage({ params }: MapDetailPageProps) {
  const { locale, id } = await params;
  requirePageModuleAccess(await auth(), 'maps');
  const t = await getTranslations({ locale, namespace: 'common' });

  const result = await getMapAction(id);

  if (!result.success) {
    notFound();
  }

  const mapItem = mapToMapItem({
    ...result.data,
    attachmentImages: result.data.attachmentImages || [],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/maps" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Link>
      </div>

      <div className="space-y-6">
        <MapDetail item={mapItem} />
        <MapDetailActions item={result.data} />
      </div>
    </div>
  );
}
