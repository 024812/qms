import { notFound } from 'next/navigation';
import { getCard } from '@/app/actions/card-actions';
import { EditCardForm } from '../../components/EditCardForm';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { ChevronLeft } from 'lucide-react';
import { parseBackImage } from '@/modules/cards/utils';

interface EditCardPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;
  const card = await getCard(id);
  const t = await getTranslations('cards.form');

  if (!card) {
    notFound();
  }

  // Convert DB card to Form initial values
  // Replace null with undefined where needed for form compatibility
  const initialData = {
    id: card.id,
    playerName: card.playerName,
    sport: card.sport,
    team: card.team ?? undefined,
    position: card.position ?? undefined,
    year: card.year,
    brand: card.brand,
    series: card.series ?? undefined,
    cardNumber: card.cardNumber ?? undefined,
    gradingCompany: card.gradingCompany ?? 'UNGRADED',
    grade: card.grade ? Number(card.grade) : undefined,
    certificationNumber: card.certificationNumber ?? undefined,
    purchasePrice: card.purchasePrice ? Number(card.purchasePrice) : undefined,
    purchaseDate: card.purchaseDate ?? undefined,
    currentValue: card.currentValue ? Number(card.currentValue) : undefined,
    estimatedValue: card.estimatedValue ? Number(card.estimatedValue) : undefined,
    soldPrice: card.soldPrice ? Number(card.soldPrice) : undefined,
    soldDate: card.soldDate ?? undefined,
    isAutographed: card.isAutographed,
    hasMemorabilia: card.hasMemorabilia,
    memorabiliaType: card.memorabiliaType ?? undefined,
    parallel: card.parallel ?? undefined,
    serialNumber: card.serialNumber ?? undefined,
    status: card.status,
    location: card.location ?? undefined,
    condition: card.condition ?? undefined,
    notes: card.notes ?? undefined,
    frontImage: card.mainImage ?? undefined,
    mainImage: card.mainImage ?? undefined,
    backImage: parseBackImage(card.attachmentImages) ?? undefined,
  };

  return (
    <div className="container py-6 max-w-[95%] space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cards/${id}`}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('cancel')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('editTitle') || 'Edit Card'}</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <EditCardForm initialData={initialData} />
      </div>
    </div>
  );
}
