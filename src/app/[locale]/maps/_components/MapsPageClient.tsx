'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { mapsModule } from '@/modules/maps/config';
import { createMapAction, deleteMapAction } from '@/app/actions/maps';
import type { CreateMapInput } from '@/modules/maps/schema';
import type { MapDTO } from '@/lib/data/maps';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { toast } from '@/lib/toast';

interface MapsPageClientProps {
  initialData: {
    maps: MapDTO[];
    total: number;
    hasMore: boolean;
  };
  initialSearchParams?: {
    filters?: {
      mapType?: string;
      status?: string;
      material?: string;
      region?: string;
      country?: string;
      search?: string;
    };
    sortBy?: string;
    sortOrder?: string;
    skip?: number;
    take?: number;
  };
  initialSearchTerm: string;
}

const PAGE_SIZE = 20;

const MAP_TYPE_VALUES = [
  'TOPOGRAPHIC',
  'ROAD',
  'CITY',
  'HISTORICAL',
  'THEMATIC',
  'NAUTICAL',
  'AERONAUTICAL',
  'ATLAS',
  'OTHER',
] as const;

const STATUS_VALUES = ['COLLECTION', 'FOR_SALE', 'SOLD', 'DISPLAY', 'FRAMED'] as const;

export function MapsPageClient({
  initialData,
  initialSearchParams,
  initialSearchTerm,
}: MapsPageClientProps) {
  const t = useTranslations('maps');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedMapIds, setSelectedMapIds] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const formFields = useLocalizedFields('maps', mapsModule.formFields);

  const currentOffset = initialSearchParams?.skip ?? 0;
  const currentPage = Math.floor(currentOffset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(initialData.total / PAGE_SIZE));

  const updateUrl = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      search: searchTerm || undefined,
      mapType: initialSearchParams?.filters?.mapType,
      status: initialSearchParams?.filters?.status,
      ...params,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    startTransition(() => {
      router.push(`/maps?${search.toString()}`);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateUrl({ offset: '0' });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateUrl({ [key]: value || undefined, offset: '0' });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ offset: String((page - 1) * PAGE_SIZE) });
  };

  const toggleMapSelection = (id: string) => {
    setSelectedMapIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedMapIds(new Set(initialData.maps.map(m => m.id)));
  };

  const clearSelection = () => {
    setSelectedMapIds(new Set());
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    const result = await createMapAction(values as CreateMapInput);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    router.refresh();
    return { success: true };
  };

  const handleBatchDelete = async () => {
    if (selectedMapIds.size === 0) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('dialogs.batchDeleteConfirm', { count: selectedMapIds.size }))) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      const results = await Promise.all(Array.from(selectedMapIds).map(id => deleteMapAction(id)));
      const failed = results.find(result => !result.success);
      if (failed && !failed.success) {
        throw new Error(failed.error.message);
      }
      toast.success(ta('deletedSuccessfully'));
      setSelectedMapIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error(ta('failedToDelete'), error instanceof Error ? error.message : undefined);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('count', { count: initialData.total })}
          {selectedMapIds.size > 0 && ` • ${t('selectedInfo', { count: selectedMapIds.size })}`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="min-w-[200px] flex-1">
          <div className="flex gap-2">
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
          </div>
        </form>

        {/* Filters */}
        <select
          value={initialSearchParams?.filters?.mapType || ''}
          onChange={e => handleFilterChange('mapType', e.target.value)}
          disabled={isPending}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm"
        >
          <option value="">{tc('all')}</option>
          {MAP_TYPE_VALUES.map(value => (
            <option key={value} value={value}>
              {t(`enums.mapType.${value}`)}
            </option>
          ))}
        </select>

        <select
          value={initialSearchParams?.filters?.status || ''}
          onChange={e => handleFilterChange('status', e.target.value)}
          disabled={isPending}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm"
        >
          <option value="">{tc('all')}</option>
          {STATUS_VALUES.map(value => (
            <option key={value} value={value}>
              {t(`enums.status.${value}`)}
            </option>
          ))}
        </select>

        {/* Actions */}
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.add')}
        </Button>

        {selectedMapIds.size > 0 && (
          <>
            <Button variant="outline" onClick={clearSelection} disabled={isBatchDeleting}>
              {t('actions.clearSelection')}
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete} disabled={isBatchDeleting}>
              {isBatchDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {t('actions.batchDelete')}
            </Button>
          </>
        )}
      </div>

      {/* Loading State */}
      {isPending && (
        <div className="mb-4 rounded-lg bg-muted p-4 text-center text-muted-foreground">
          {tc('loading')}
        </div>
      )}

      {/* Map Grid */}
      {initialData.maps.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="mb-2 text-xl">{t('empty.title')}</p>
          <p className="text-sm">{t('empty.description')}</p>
        </div>
      ) : (
        <>
          {/* Selection Controls */}
          <div className="mb-4 flex gap-2">
            <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">
              {t('actions.selectAll')}
            </button>
            {selectedMapIds.size > 0 && (
              <button onClick={clearSelection} className="text-sm text-gray-600 hover:underline">
                {t('actions.clearSelection')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {initialData.maps.map(map => (
              <div
                key={map.id}
                className={`relative cursor-pointer rounded-lg border p-4 transition-shadow hover:shadow-md ${
                  selectedMapIds.has(map.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200'
                }`}
                onClick={() => router.push(`/maps/${map.id}`)}
              >
                <label
                  className="absolute right-3 top-3 z-10"
                  onClick={event => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedMapIds.has(map.id)}
                    onChange={() => toggleMapSelection(map.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                    aria-label={map.name}
                  />
                </label>

                {/* Image */}
                {map.mainImage && (
                  <div className="mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={map.mainImage}
                      alt={map.name}
                      className="h-48 w-full rounded object-cover"
                    />
                  </div>
                )}

                {/* Item Number */}
                <div className="mb-1 text-sm text-muted-foreground">#{map.itemNumber}</div>

                {/* Name */}
                <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{map.name}</h3>

                {/* Details */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  {map.region && (
                    <div>
                      {t('fields.region.label')}: {map.region}
                    </div>
                  )}
                  {map.publishedYear && (
                    <div>
                      {t('fields.publishedYear.label')}: {map.publishedYear}
                    </div>
                  )}
                  {map.publisher && (
                    <div className="line-clamp-1">
                      {t('fields.publisher.label')}: {map.publisher}
                    </div>
                  )}
                </div>

                {/* Location */}
                {map.location && (
                  <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-muted-foreground">
                    {map.location}
                  </div>
                )}
              </div>
            ))}
          </div>

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
        </>
      )}

      {/* Create Dialog */}
      <ModuleItemDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
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
