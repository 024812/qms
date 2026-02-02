'use client';

import { useState, useEffect, useCallback } from 'react';
import { PackageOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CardCard } from '@/modules/cards/ui/CardCard';
import type { CardItem } from '@/modules/cards/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getCards } from '@/app/actions/card-actions';
import { CardForm } from './components/CardForm';
import { CardToolbar } from './components/CardToolbar';
import { CardListView } from './components/CardListView';
import { useTranslations } from 'next-intl';

export default function CardsPage() {
  const t = useTranslations('cards');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: 'ALL',
    gradingCompany: 'ALL',
    status: 'ALL',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCards({
        search: searchTerm,
        sport: filters.sport,
        gradingCompany: filters.gradingCompany,
        status: filters.status,
        page: currentPage,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCards(data.items as any);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, currentPage]);

  // Fetch cards on mount and when search/filters/page change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Added fetchData to dependency array

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchData(); // Refresh list
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center justify-center h-96">
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
        <CardListView items={cards} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {cards.map(card => (
            <div key={card.id}>
              <CardCard item={card} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {cards.length > 0 && (
        <div className="flex items-center justify-end gap-2 py-4">
          <span className="text-sm text-muted-foreground mr-2">
            {t('pagination.page', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add/Edit Card Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialogs.addTitle')}</DialogTitle>
          </DialogHeader>
          <CardForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
