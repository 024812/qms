'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PackageOpen, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { QuiltDialog } from '@/components/quilts/QuiltDialog';
import { StatusChangeDialog } from '@/components/quilts/StatusChangeDialog';
import { QuiltImageDialog } from '@/components/quilts/QuiltImageDialog';
import { changeQuiltStatusAction, deleteQuiltAction, saveQuiltAction } from '@/app/actions/quilts';
import { QuiltToolbar } from '../components/QuiltToolbar';
import { QuiltListView } from '../components/QuiltListView';
import { QuiltGridView } from '../components/QuiltGridView';
import { toast } from '@/lib/toast';
import { useQuilts, type QuiltsResponse } from '@/hooks/useQuilts';
import { useAppSettings } from '@/hooks/useSettings';
import { useQueryClient } from '@tanstack/react-query';
import type {
  Quilt,
  SortField,
  SortDirection,
  ViewMode,
  QuiltFormData,
  QuiltSearchInput,
} from '@/types/quilt';
import type { FilterCriteria } from '@/components/quilts/AdvancedFilters';

interface QuiltsPageClientProps {
  initialData: QuiltsResponse;
  initialSearchParams?: QuiltSearchInput;
  initialSearchTerm: string;
  initialFilters: FilterCriteria;
}

export function QuiltsPageClient({
  initialData,
  initialSearchParams,
  initialSearchTerm,
  initialFilters,
}: QuiltsPageClientProps) {
  const router = useRouter();
  const t = useTranslations();

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
  const [quiltDialogOpen, setQuiltDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedQuilt, setSelectedQuilt] = useState<Quilt | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const queryClient = useQueryClient();
  const { data: quiltsData, isLoading } = useQuilts(initialSearchParams, { initialData });
  const { data: appSettings } = useAppSettings();

  const quilts: Quilt[] = useMemo(
    () => quiltsData?.quilts || initialData.quilts,
    [initialData.quilts, quiltsData]
  );

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    quilts.forEach(quilt => {
      if (quilt.color) colors.add(quilt.color);
    });
    return Array.from(colors).sort();
  }, [quilts]);

  const availableMaterials = useMemo(() => {
    const materials = new Set<string>();
    quilts.forEach(quilt => {
      if (quilt.fillMaterial) materials.add(quilt.fillMaterial);
    });
    return Array.from(materials).sort();
  }, [quilts]);

  const filteredQuilts = useMemo(() => {
    let result = [...quilts];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        quilt =>
          quilt.name?.toLowerCase().includes(term) ||
          quilt.itemNumber?.toString().includes(term) ||
          quilt.fillMaterial?.toLowerCase().includes(term) ||
          quilt.location?.toLowerCase().includes(term) ||
          quilt.season?.toLowerCase().includes(term) ||
          quilt.currentStatus?.toLowerCase().includes(term)
      );
    }

    if (filters.seasons.length > 0) {
      result = result.filter(quilt => filters.seasons.includes(quilt.season));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(quilt => filters.statuses.includes(quilt.currentStatus));
    }
    if (filters.colors.length > 0) {
      result = result.filter(quilt => filters.colors.includes(quilt.color));
    }
    if (filters.materials.length > 0) {
      result = result.filter(quilt => filters.materials.includes(quilt.fillMaterial));
    }
    if (filters.minWeight !== undefined) {
      result = result.filter(quilt => (quilt.weightGrams ?? 0) >= filters.minWeight!);
    }
    if (filters.maxWeight !== undefined) {
      result = result.filter(quilt => (quilt.weightGrams ?? 0) <= filters.maxWeight!);
    }
    if (filters.minLength !== undefined) {
      result = result.filter(quilt => (quilt.lengthCm ?? 0) >= filters.minLength!);
    }
    if (filters.maxLength !== undefined) {
      result = result.filter(quilt => (quilt.lengthCm ?? 0) <= filters.maxLength!);
    }
    if (filters.minWidth !== undefined) {
      result = result.filter(quilt => (quilt.widthCm ?? 0) >= filters.minWidth!);
    }
    if (filters.maxWidth !== undefined) {
      result = result.filter(quilt => (quilt.widthCm ?? 0) <= filters.maxWidth!);
    }

    if (sortField) {
      result.sort((a, b) => {
        if (sortField === 'weight') {
          const aWeight = a.weightGrams ?? 0;
          const bWeight = b.weightGrams ?? 0;
          return sortDirection === 'asc' ? aWeight - bWeight : bWeight - aWeight;
        }

        if (sortField === 'size') {
          const aArea = a.lengthCm && a.widthCm ? a.lengthCm * a.widthCm : 0;
          const bArea = b.lengthCm && b.widthCm ? b.lengthCm * b.widthCm : 0;
          return sortDirection === 'asc' ? aArea - bArea : bArea - aArea;
        }

        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filters, quilts, searchTerm, sortDirection, sortField]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuilts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuilts.map(q => q.id)));
    }
  };

  const handleAddQuilt = () => {
    setSelectedQuilt(null);
    setQuiltDialogOpen(true);
  };

  const handleEditQuilt = (quilt: Quilt) => {
    setSelectedQuilt(quilt);
    setQuiltDialogOpen(true);
  };

  const handleDeleteQuilt = async (quilt: Quilt) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('quilts.confirmDelete'))) return;

    try {
      const result = await deleteQuiltAction(quilt.id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quilts'] }),
        queryClient.invalidateQueries({ queryKey: ['usage'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      router.refresh();
      toast.success(t('toasts.quiltDeleted'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('quilts.dialogs.unknownError');
      toast.error(t('quilts.dialogs.deleteFailed'), errorMessage);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('quilts.dialogs.confirmBatchDelete', { count: selectedIds.size }))) {
      return;
    }

    try {
      const results = await Promise.all(Array.from(selectedIds).map(id => deleteQuiltAction(id)));
      const failed = results.find(result => !result.success);
      if (failed && !failed.success) {
        throw new Error(failed.error.message);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quilts'] }),
        queryClient.invalidateQueries({ queryKey: ['usage'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      router.refresh();
      setSelectedIds(new Set());
      setIsSelectMode(false);
      toast.success(t('toasts.quiltDeleted'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('quilts.dialogs.unknownError');
      toast.error(t('quilts.dialogs.deleteFailed'), errorMessage);
    }
  };

  const handleStatusChange = (quilt: Quilt) => {
    setSelectedQuilt(quilt);
    setStatusDialogOpen(true);
  };

  const handleViewHistory = (quilt: Quilt) => {
    router.push(`/usage/${quilt.id}?from=quilts`);
  };

  const handleViewImages = (quilt: Quilt) => {
    setSelectedQuilt(quilt);
    setImageDialogOpen(true);
  };

  const handleQuiltDoubleClick = (quilt: Quilt) => {
    const doubleClickAction = (appSettings?.doubleClickAction as string) || 'status';

    switch (doubleClickAction) {
      case 'status':
        handleStatusChange(quilt);
        break;
      case 'edit':
        handleEditQuilt(quilt);
        break;
      case 'view':
        handleViewHistory(quilt);
        break;
      case 'none':
      default:
        break;
    }
  };

  const handleSaveQuilt = async (data: QuiltFormData) => {
    const processedData = {
      ...data,
      purchaseDate: data.purchaseDate
        ? typeof data.purchaseDate === 'string'
          ? new Date(data.purchaseDate)
          : data.purchaseDate
        : undefined,
    };

    const result = selectedQuilt
      ? await saveQuiltAction({ id: selectedQuilt.id, ...processedData })
      : await saveQuiltAction(processedData);

    if (!result.success) {
      const firstFieldError = result.error.fieldErrors
        ? Object.values(result.error.fieldErrors).find(messages => messages?.length)?.[0]
        : undefined;

      throw new Error(firstFieldError || result.error.message);
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['quilts'] }),
      queryClient.invalidateQueries({ queryKey: ['usage'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
    router.refresh();

    toast.success(selectedQuilt ? t('toasts.quiltUpdated') : t('toasts.quiltAdded'));
    setQuiltDialogOpen(false);
  };

  const handleStatusChangeConfirm = async (
    quiltId: string,
    newStatus: string,
    options?: { startDate?: string; endDate?: string; notes?: string }
  ) => {
    if (!selectedQuilt) return;

    try {
      const result = await changeQuiltStatusAction({
        quiltId,
        status: newStatus as 'IN_USE' | 'STORAGE' | 'MAINTENANCE',
        usageType: 'REGULAR',
        notes: options?.notes,
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quilts'] }),
        queryClient.invalidateQueries({ queryKey: ['usage'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      router.refresh();

      toast.success(t('toasts.statusUpdated'));
      setStatusDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('quilts.dialogs.unknownError');
      toast.error(t('quilts.dialogs.statusUpdateFailed'), errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (quilts.length === 0) {
    return (
      <div className="space-y-6">
        <QuiltToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchClear={() => setSearchTerm('')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isSelectMode={isSelectMode}
          onSelectModeToggle={() => setIsSelectMode(!isSelectMode)}
          selectedCount={selectedIds.size}
          onBatchDelete={handleBatchDelete}
          onAddQuilt={handleAddQuilt}
          filters={filters}
          onFiltersChange={setFilters}
          availableColors={availableColors}
          availableMaterials={availableMaterials}
        />
        <EmptyState
          icon={PackageOpen}
          title={t('pages.noQuilts')}
          description={t('pages.noQuiltsDescription')}
          action={{
            label: t('quilts.actions.add'),
            onClick: handleAddQuilt,
          }}
        />
      </div>
    );
  }

  if (filteredQuilts.length === 0) {
    return (
      <div className="space-y-6">
        <QuiltToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchClear={() => setSearchTerm('')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isSelectMode={isSelectMode}
          onSelectModeToggle={() => setIsSelectMode(!isSelectMode)}
          selectedCount={selectedIds.size}
          onBatchDelete={handleBatchDelete}
          onAddQuilt={handleAddQuilt}
          filters={filters}
          onFiltersChange={setFilters}
          availableColors={availableColors}
          availableMaterials={availableMaterials}
        />
        <EmptyState
          icon={SearchX}
          title={t('pages.noResults')}
          description={t('pages.noResultsDescription')}
          action={{
            label: t('common.clearFilters'),
            onClick: () => {
              setSearchTerm('');
              setFilters({ seasons: [], statuses: [], colors: [], materials: [] });
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuiltToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSelectMode={isSelectMode}
        onSelectModeToggle={() => setIsSelectMode(!isSelectMode)}
        selectedCount={selectedIds.size}
        onBatchDelete={handleBatchDelete}
        onAddQuilt={handleAddQuilt}
        filters={filters}
        onFiltersChange={setFilters}
        availableColors={availableColors}
        availableMaterials={availableMaterials}
      />

      {viewMode === 'list' ? (
        <QuiltListView
          quilts={filteredQuilts}
          searchTerm={searchTerm}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onSelectToggle={handleSelectToggle}
          onSelectAll={handleSelectAll}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={handleEditQuilt}
          onDelete={handleDeleteQuilt}
          onStatusChange={handleStatusChange}
          onViewHistory={handleViewHistory}
          onViewImages={handleViewImages}
          onDoubleClick={handleQuiltDoubleClick}
        />
      ) : (
        <QuiltGridView
          quilts={filteredQuilts}
          searchTerm={searchTerm}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onSelectToggle={handleSelectToggle}
          onEdit={handleEditQuilt}
          onDelete={handleDeleteQuilt}
          onStatusChange={handleStatusChange}
          onViewImages={handleViewImages}
          onDoubleClick={handleQuiltDoubleClick}
        />
      )}

      <QuiltDialog
        open={quiltDialogOpen}
        onOpenChange={setQuiltDialogOpen}
        quilt={selectedQuilt}
        onSave={handleSaveQuilt}
      />

      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        quilt={selectedQuilt}
        onStatusChange={handleStatusChangeConfirm}
      />

      <QuiltImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        quilt={selectedQuilt}
      />
    </div>
  );
}
