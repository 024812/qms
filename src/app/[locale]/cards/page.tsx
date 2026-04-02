import { getCardsAction } from '@/app/actions/cards';
import type { GetCardsActionResult } from '@/app/actions/cards.types';

import { CardsPageClient } from './_components/CardsPageClient';

export default async function CardsPage() {
  const initialResult = await getCardsAction({ page: 1 });

  if (!initialResult.success) {
    throw new Error(initialResult.error.message);
  }

  const initialData: GetCardsActionResult = initialResult.data;

  return <CardsPageClient initialData={initialData} />;
}
