'use client';

/**
 * PaddlesPageClient Component
 *
 * Client shell for the paddles page.
 * Handles UI state, dialogs, and interactions.
 */

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { paddleModule } from '@/modules/paddles/config';
import { createPaddleAction } from '@/app/actions/paddles';
import type { PaddleItem, CreatePaddleInput } from '@/modules/paddles/schema';
import { PaddleCard } from '@/modules/paddles/ui/PaddleCard';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import type { PaddleSearchInput } from '@/app/actions/paddles';

interface PaddlesPageClientProps {
  initialData: {
    paddles: PaddleItem[];
    total: number;
    hasMore: boolean;
  };
  initialSearchParams?: PaddleSearchInput;
  initialSearchTerm: string;
}

const PAGE_SIZE = 20;

const STATUS_VALUES = ['ACTIVE', 'RETIRED', 'FOR_SALE', 'SOLD', 'DISPLAY'] as const;

export function PaddlesPageClient({
  initialData,
  initialSearchParams,
  initialSearchTerm,
}: PaddlesPageClientProps) {
  const t = useTranslations('paddles');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const formFields = useLocalizedFields('paddles', paddleModule.formFields);

  const currentStatus = initialSearchParams?.filters?.status;
  const currentOffset = initialSearchParams?.skip ?? 0;
  const currentPage = Math.floor(currentOffset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(initialData.total / PAGE_SIZE));

  const navigate = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      search: searchTerm || undefined,
      status: currentStatus,
      ...params,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    startTransition(() => {
      router.push(`/paddles?${search.toString()}`);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({ offset: '0' });
  };

  const handleStatusFilter = (value: string | undefined) => {
    navigate({ status: value, offset: '0' });
  };

  const handlePageChange = (page: number) => {
    navigate({ offset: String((page - 1) * PAGE_SIZE) });
  };

  const handleCardClick = (paddle: PaddleItem) => {
    router.push(`/paddles/${paddle.id}`);
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    const result = await createPaddleAction(values as CreatePaddleInput);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    router.refresh();
    return { success: true };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('count', { count: initialData.total })}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.add')}
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          disabled={isPending}
        />
        <Button type="submit" variant="secondary" disabled={isPending}>
          <Search className="mr-2 h-4 w-4" />
          {tc('search')}
        </Button>
      </form>

      {/* Status Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilter(undefined)}
          className={`rounded px-3 py-1 text-sm transition-colors ${
            !currentStatus
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          disabled={isPending}
        >
          {tc('all')}
        </button>
        {STATUS_VALUES.map(value => (
          <button
            key={value}
            onClick={() => handleStatusFilter(value)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              currentStatus === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            disabled={isPending}
          >
            {t(`enums.status.${value}`)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isPending && <div className="py-8 text-center text-muted-foreground">{tc('loading')}</div>}

      {/* Paddles Grid */}
      {!isPending && initialData.paddles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">{t('empty.title')}</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.addFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialData.paddles.map(paddle => (
            <PaddleCard key={paddle.id} item={paddle} onClick={() => handleCardClick(paddle)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            {tc('pagination.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tc('pagination.pageInfo', { page: currentPage, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!initialData.hasMore || isPending}
          >
            {tc('pagination.next')}
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <ModuleItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title={t('dialogs.createTitle')}
        description={t('dialogs.createDesc')}
        fields={formFields}
        onSubmit={handleCreate}
        successMessage={ta('createdSuccessfully')}
        errorMessage={ta('failedToCreate')}
        submitLabel={tc('create')}
      />
    </div>
  );
}
