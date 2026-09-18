'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { spiritModule } from '@/modules/spirits/config';
import { createSpiritAction } from '@/app/actions/spirits';
import type { Spirit, CreateSpiritInput } from '@/modules/spirits/schema';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';

interface SpiritsPageClientProps {
  initialSpirits: Spirit[];
  initialTotal: number;
  initialHasMore: boolean;
  initialFilters: {
    page: number;
    pageSize: number;
    search?: string;
    spiritType?: string;
    status?: string;
    bottleStatus?: string;
    brand?: string;
    country?: string;
    region?: string;
    limitedEdition?: string;
    sort: string;
  };
}

const SPIRIT_TYPE_VALUES = [
  'WHISKY',
  'COGNAC',
  'BRANDY',
  'RUM',
  'VODKA',
  'GIN',
  'TEQUILA',
  'BAIJIU',
  'WINE',
  'OTHER',
] as const;

const STATUS_VALUES = ['COLLECTION', 'AGING', 'FOR_SALE', 'SOLD', 'OPENED', 'EMPTY'] as const;

export function SpiritsPageClient({
  initialSpirits,
  initialTotal,
  initialHasMore,
  initialFilters,
}: SpiritsPageClientProps) {
  const t = useTranslations('spirits');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [spiritType, setSpiritType] = useState(initialFilters.spiritType ?? '');
  const [status, setStatus] = useState(initialFilters.status ?? '');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const formFields = useLocalizedFields('spirits', spiritModule.formFields);

  const totalPages = Math.max(1, Math.ceil(initialTotal / initialFilters.pageSize));

  const navigate = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      search: search || undefined,
      spiritType: spiritType || undefined,
      status: status || undefined,
      sort: initialFilters.sort,
      ...params,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    startTransition(() => {
      router.push(`/spirits?${searchParams.toString()}`);
    });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({ page: '1' });
  };

  const handlePageChange = (page: number) => {
    navigate({ page: String(page) });
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    const result = await createSpiritAction(values as CreateSpiritInput);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    router.refresh();
    return { success: true };
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.add')}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                {tc('search')}
              </label>
              <Input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                disabled={isPending}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                {t('fields.spiritType.label')}
              </label>
              <select
                value={spiritType}
                onChange={e => setSpiritType(e.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{tc('all')}</option>
                {SPIRIT_TYPE_VALUES.map(value => (
                  <option key={value} value={value}>
                    {t(`enums.spiritType.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                {t('fields.status.label')}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">{tc('all')}</option>
                {STATUS_VALUES.map(value => (
                  <option key={value} value={value}>
                    {t(`enums.status.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isPending}>
                <Search className="mr-2 h-4 w-4" />
                {isPending ? tc('searching') : tc('search')}
              </Button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow">
          <div className="text-sm text-muted-foreground">{t('count', { count: initialTotal })}</div>
        </div>
      </div>

      {/* Spirits Grid */}
      {initialSpirits.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg">{t('empty.title')}</p>
          <p className="mt-2 text-sm">{t('empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialSpirits.map(spirit => (
            <div
              key={spirit.id}
              className="cursor-pointer rounded-lg border bg-card p-4 shadow transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/spirits/${spirit.id}`)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/spirits/${spirit.id}`);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {spirit.mainImage && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spirit.mainImage}
                    alt={spirit.name}
                    className="h-48 w-full rounded object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{spirit.name}</h3>
                  <span className="text-sm text-muted-foreground">#{spirit.itemNumber}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{t(`enums.spiritType.${spirit.spiritType}`)}</span>
                  {spirit.brand && <span className="ml-2">· {spirit.brand}</span>}
                </div>
                {(spirit.vintage || spirit.age) && (
                  <div className="text-sm text-muted-foreground">
                    {spirit.vintage && (
                      <span>
                        {spirit.vintage}
                        {tc('years')}
                      </span>
                    )}
                    {spirit.vintage && spirit.age && <span> · </span>}
                    {spirit.age && (
                      <span>
                        {spirit.age}
                        {tc('years')}
                      </span>
                    )}
                  </div>
                )}
                {spirit.abv && (
                  <div className="text-sm text-muted-foreground">
                    {t('fields.abv.label')}: {spirit.abv}%
                  </div>
                )}
                <div className="flex gap-2 text-sm">
                  <span className="rounded bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {t(`enums.status.${spirit.status}`)}
                  </span>
                  {spirit.limitedEdition && (
                    <span className="rounded bg-amber-100 px-2 py-1 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {t('fields.limitedEdition.label')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(initialFilters.page - 1)}
            disabled={initialFilters.page <= 1 || isPending}
          >
            {tc('pagination.prev')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {tc('pagination.pageInfo', { page: initialFilters.page, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(initialFilters.page + 1)}
            disabled={!initialHasMore || isPending}
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
