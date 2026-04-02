import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getCardsAction } from '@/app/actions/cards';
import { SoldCardListView } from '../components/SoldCardListView';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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

  const result = await getCardsAction({
    page,
    pageSize,
    filter: { status: 'SOLD' },
    search: query,
  });

  if (!result.success) {
    throw new Error(result.error.message);
  }

  const { items, total } = result.data;

  return (
    <div className="w-full p-6 space-y-8 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {/* <LayoutDashboard className="w-5 h-5" /> We can use a different icon here if needed, or remove */}
          <h2 className="text-lg font-medium">{t('soldCards')}</h2>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {tCards('totalSales')}
            </h1>
            <p className="text-muted-foreground mt-1">{tCards('totalSalesDesc')}</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Total Sold</span>
              <span className="font-mono font-bold text-xl">{total}</span>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SoldCardListView items={items} searchTerm={query} />
      </Suspense>

      {/* Basic Pagination (can be improved later) */}
      {/* If we want to add pagination UI, we can do it here, but for now scrolling or simple next/prev is fine if items > 50 */}
    </div>
  );
}
