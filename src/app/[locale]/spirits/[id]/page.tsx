import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getSpiritById } from '@/lib/data/spirits';
import { SpiritDetail } from '@/modules/spirits/ui/SpiritDetail';
import { spiritToSpiritItem } from '@/modules/spirits/schema';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const spirit = await getSpiritById(id);

  if (!spirit) {
    return {
      title: '藏酒不存在 - QMS',
    };
  }

  return {
    title: `${spirit.name} - 藏酒管理 - QMS`,
    description: `查看 ${spirit.name} 的详细信息`,
  };
}

export default async function SpiritDetailPage({ params }: PageProps) {
  // Auth check
  const session = await auth();
  requirePageModuleAccess(session, 'spirits');

  // Fetch spirit
  const { id } = await params;
  const spirit = await getSpiritById(id);

  if (!spirit) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <SpiritDetail item={spiritToSpiritItem(spirit)} />
        </div>
      </div>
    </div>
  );
}
