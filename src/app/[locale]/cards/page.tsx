import { getCardsAction } from '@/app/actions/cards';

import { CardsPageClient } from './_components/CardsPageClient';

export default async function CardsPage() {
  const initialResult = await getCardsAction({ page: 1 });

  if (!initialResult.success) {
    throw new Error(initialResult.error.message);
  }

  const initialData = initialResult.data;

  return (
    <CardsPageClient
      initialCards={initialData.items}
      initialTotalItems={initialData.total}
      initialTotalPages={initialData.totalPages}
      initialPage={initialData.page}
    />
  );
}
