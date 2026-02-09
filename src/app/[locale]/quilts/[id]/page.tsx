import { notFound } from 'next/navigation';
import { getQuiltById } from '@/lib/data/quilts';
import { QuiltDetail } from '@/modules/quilts/ui/QuiltDetail';
import type { QuiltItem } from '@/modules/quilts/schema';

interface QuiltPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function QuiltPage({ params }: QuiltPageProps) {
  const { id } = await params;
  const quilt = await getQuiltById(id);

  if (!quilt) {
    notFound();
  }

  // Convert to QuiltItem format for QuiltDetail component
  const quiltItem: QuiltItem = {
    id: quilt.id,
    type: 'quilt',
    itemNumber: quilt.itemNumber,
    name: quilt.name,
    season: quilt.season as 'WINTER' | 'SUMMER' | 'SPRING_AUTUMN',
    currentStatus: quilt.currentStatus as 'IN_USE' | 'STORAGE' | 'MAINTENANCE',
    lengthCm: quilt.lengthCm,
    widthCm: quilt.widthCm,
    weightGrams: quilt.weightGrams,
    fillMaterial: quilt.fillMaterial,
    materialDetails: quilt.materialDetails,
    color: quilt.color,
    brand: quilt.brand,
    location: quilt.location,
    packagingInfo: quilt.packagingInfo,
    purchaseDate: quilt.purchaseDate,
    groupId: quilt.groupId,
    mainImage: quilt.mainImage,
    attachmentImages: quilt.attachmentImages,
    notes: quilt.notes,
    imageUrl: quilt.imageUrl ?? null,
    thumbnailUrl: quilt.thumbnailUrl ?? null,
    createdAt: quilt.createdAt,
    updatedAt: quilt.updatedAt,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <QuiltDetail item={quiltItem} />
    </div>
  );
}
