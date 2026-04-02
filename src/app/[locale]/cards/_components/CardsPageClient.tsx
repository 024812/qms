'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutDashboard, Loader2, PackageOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';

import type { GetCardsActionInput, GetCardsActionResult } from '@/app/actions/cards.types';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCards } from '@/hooks/useCards';
import { CardCard } from '@/modules/cards/ui/CardCard';
import { CreateCardForm } from '../components/CreateCardForm';
import { CardListView } from '../components/CardListView';
import { CardToolbar } from '../components/CardToolbar';

interface CardsPageClientProps {
  initialData: GetCardsActionResult;
}

export function CardsPageClient({ initialData }: CardsPageClientProps) {
  const t = useTranslations('cards');
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: 'ALL',
    gradingCompany: 'ALL',
    status: 'ALL',
  });
  const [currentPage, setCurrentPage] = useState(initialData.page);

  const queryInput = useMemo<GetCardsActionInput>(() => {
    const filter: NonNullable<GetCardsActionInput['filter']> = {};

    if (filters.sport !== 'ALL') {
      filter.sport = filters.sport as NonNullable<GetCardsActionInput['filter']>['sport'];
    }
    if (filters.gradingCompany !== 'ALL') {
      filter.gradingCompany = filters.gradingCompany as NonNullable<
        GetCardsActionInput['filter']
      >['gradingCompany'];
    }
    if (filters.status !== 'ALL') {
      filter.status = filters.status as NonNullable<GetCardsActionInput['filter']>['status'];
    }

    return {
      search: searchTerm || undefined,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      page: currentPage,
    };
  }, [currentPage, filters, searchTerm]);

  const cardsQuery = useCards(queryInput, { initialData });
  const cards = cardsQuery.data?.items ?? initialData.items;
  const totalPages = cardsQuery.data?.totalPages ?? initialData.totalPages;
  const totalItems = cardsQuery.data?.total ?? initialData.total;
  const loading = cardsQuery.isFetching && cards.length === 0;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSuccess = async () => {
    setDialogOpen(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cards'] }),
      cardsQuery.refetch(),
    ]);
  };

  return (
    <div className="min-h-screen w-full space-y-8 bg-background p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-5 w-5" />
          <h2 className="text-lg font-medium">Dashboard</h2>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your collection, track values, and analyze market trends.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Total Cards</span>
              <span className="font-mono text-xl font-bold">{totalItems}</span>
            </div>
          </div>
        </div>
      </div>

      <CardToolbar
        viewMode={viewMode}
        onViewChange={setViewMode}
        onSearch={setSearchTerm}
        onAdd={() => setDialogOpen(true)}
        filters={filters}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onFilterChange={handleFilterChange as any}
      />

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t('empty.title')}
          description={t('empty.description')}
          action={{
            label: t('actions.add'),
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : viewMode === 'list' ? (
        <CardListView items={cards} searchTerm={searchTerm} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {cards.map(card => (
            <div key={card.id}>
              <CardCard item={card} />
            </div>
          ))}
        </div>
      )}

      {cards.length > 0 && (
        <div className="flex items-center justify-end gap-2 border-t py-4">
          <span className="mr-6 text-sm text-muted-foreground">
            {t('pagination.page', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.addTitle')}</DialogTitle>
          </DialogHeader>
          <CreateCardForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
