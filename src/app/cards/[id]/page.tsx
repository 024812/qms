import { notFound } from 'next/navigation';
import { getCard } from '@/app/actions/card-actions';
import { CardDetail } from '@/modules/cards/ui/CardDetail';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CardDetailActions } from '../components/CardDetailActions';

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    notFound();
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cards">
              <ChevronLeft className="w-4 h-4 mr-2" />
              返回列表
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {card.year} {card.brand} {card.playerName}
          </h1>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <CardDetailActions card={card as any} />
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CardDetail item={card as any} />
    </div>
  );
}
