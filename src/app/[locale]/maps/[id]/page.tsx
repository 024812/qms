import { getMapAction } from '@/app/actions/maps';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { MapDetail } from '@/modules/maps/ui/MapDetail';
import { mapToMapItem } from '@/modules/maps/schema';
import { notFound } from 'next/navigation';

interface MapDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MapDetailPage({ params }: MapDetailPageProps) {
  const { id } = await params;
  requirePageModuleAccess(await auth(), 'maps');

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
      <MapDetail item={mapItem} />
    </div>
  );
}
