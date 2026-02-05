import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCards } from '@/app/actions/card-actions';
import { SoldCardListView } from '../components/SoldCardListView';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { CardItem } from '@/modules/cards/schema';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SoldCardsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('sidebar');
  const tCards = await getTranslations('cards.overview');

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const query = (resolvedSearchParams?.query as string) || '';
  const pageSize = 50;

  const { items: rawItems, total } = await getCards({
    page,
    pageSize,
    filter: { status: 'SOLD' },
    search: query,
  });

  const items: CardItem[] = rawItems.map(item => ({
    ...item,
    type: 'card' as const,
    tags: null,
    grade: item.grade ? Number(item.grade) : null,
    gradingCompany: item.gradingCompany || 'UNGRADED',
    purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
    purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
    currentValue: item.currentValue ? Number(item.currentValue) : null,
    estimatedValue: item.estimatedValue ? Number(item.estimatedValue) : null,
    soldPrice: item.soldPrice ? Number(item.soldPrice) : null,
    soldDate: item.soldDate ? new Date(item.soldDate) : null,
    lastValueUpdate: item.valuationDate || null,
    attachmentImages: item.attachmentImages as string[] | null,
  }));

  return (
    <div className="space-y-6 container mx-auto py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {t('soldCards')}
          <span className="text-sm font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full">
            {total}
          </span>
        </h1>
        <p className="text-muted-foreground">{tCards('totalSalesDesc')}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SoldCardListView items={items} searchTerm={query} />
      </Suspense>

      {/* Basic Pagination (can be improved later) */}
      {/* If we want to add pagination UI, we can do it here, but for now scrolling or simple next/prev is fine if items > 50 */}
    </div>
  );
}
