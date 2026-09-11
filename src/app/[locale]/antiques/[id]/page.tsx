import { notFound } from 'next/navigation';

import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getAntiqueById } from '@/lib/data/antiques';
import { AntiqueDetail } from '@/modules/antiques/ui/AntiqueDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AntiqueDetailPage({ params }: PageProps) {
  const session = await auth();
  requirePageModuleAccess(session, 'antiques');

  const resolvedParams = await params;
  const antique = await getAntiqueById(resolvedParams.id);

  if (!antique) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{antique.name}</h1>
        <div className="flex gap-2">
          <button className="rounded-md border bg-card px-4 py-2 hover:bg-accent">编辑</button>
          <button className="rounded-md border border-destructive bg-card px-4 py-2 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            删除
          </button>
        </div>
      </div>

      {/* Detail Component */}
      <div className="rounded-lg border bg-card p-6">
        <AntiqueDetail item={antique} />
      </div>
    </div>
  );
}
