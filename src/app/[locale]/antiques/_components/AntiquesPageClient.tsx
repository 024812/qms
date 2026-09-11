'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { antiqueModule } from '@/modules/antiques/config';
import { createAntiqueAction } from '@/app/actions/antiques';
import type { AntiqueItem, CreateAntiqueInput } from '@/modules/antiques/schema';
import { AntiqueCard } from '@/modules/antiques/ui/AntiqueCard';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';

interface AntiquesPageClientProps {
  initialAntiques: AntiqueItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSearch?: string;
  initialCategory?: string;
  initialStatus?: string;
}

const CATEGORY_VALUES = ['JADE', 'WOOD', 'CERAMIC', 'METAL', 'STONE', 'PAPER', 'OTHER'] as const;

const STATUS_VALUES = ['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'APPRAISAL'] as const;

export function AntiquesPageClient({
  initialAntiques,
  initialTotal,
  initialPage,
  initialPageSize,
  initialSearch,
  initialCategory,
  initialStatus,
}: AntiquesPageClientProps) {
  const t = useTranslations('antiques');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const formFields = useLocalizedFields('antiques', antiqueModule.formFields);

  const [search, setSearch] = useState(initialSearch || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [status, setStatus] = useState(initialStatus || '');

  const totalPages = Math.ceil(initialTotal / initialPageSize);

  const updateUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${newParams.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: search || undefined, page: '1' });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateUrl({ category: value || undefined, page: '1' });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateUrl({ status: value || undefined, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page: page.toString() });
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    const result = await createAntiqueAction(values as CreateAntiqueInput);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    router.refresh();
    return { success: true };
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('count', { count: initialTotal })}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.add')}
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2"
          />
          <Button type="submit" disabled={isPending}>
            {tc('search')}
          </Button>
        </form>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">{t('fields.category.label')}</label>
            <select
              value={category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              disabled={isPending}
            >
              <option value="">{tc('all')}</option>
              {CATEGORY_VALUES.map(value => (
                <option key={value} value={value}>
                  {t(`enums.category.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">{t('fields.status.label')}</label>
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              disabled={isPending}
            >
              <option value="">{tc('all')}</option>
              {STATUS_VALUES.map(value => (
                <option key={value} value={value}>
                  {t(`enums.status.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isPending && (
        <div className="rounded-lg border bg-muted p-4 text-center text-muted-foreground">
          {tc('loading')}
        </div>
      )}

      {/* Antiques Grid */}
      {initialAntiques.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {t('empty.title')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialAntiques.map(antique => (
            <div
              key={antique.id}
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push(`${pathname}/${antique.id}`)}
            >
              <AntiqueCard item={antique} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(initialPage - 1)}
            disabled={initialPage <= 1 || isPending}
            className="rounded-md border bg-card px-3 py-1 disabled:opacity-50"
          >
            {tc('pagination.prev')}
          </button>

          <span className="text-sm text-muted-foreground">
            {tc('pagination.pageInfo', { page: initialPage, totalPages })}
          </span>

          <button
            onClick={() => handlePageChange(initialPage + 1)}
            disabled={initialPage >= totalPages || isPending}
            className="rounded-md border bg-card px-3 py-1 disabled:opacity-50"
          >
            {tc('pagination.next')}
          </button>
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
