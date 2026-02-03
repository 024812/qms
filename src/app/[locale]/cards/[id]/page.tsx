import { notFound } from 'next/navigation';
import { getCard } from '@/app/actions/card-actions';
import { parseBackImage } from '@/modules/cards/utils';
import { UnifiedCardDashboard } from '../components/UnifiedCardDashboard';

interface CardPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;
  const card = await getCard(id);

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
    <div className="px-6 py-6 min-h-screen">
      <UnifiedCardDashboard initialData={initialData} />
    </div>
  );
}
