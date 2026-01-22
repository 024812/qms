'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { PackageOpen, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { QuiltDialog } from '@/components/quilts/QuiltDialog';
import { StatusChangeDialog } from '@/components/quilts/StatusChangeDialog';
import { QuiltImageDialog } from '@/components/quilts/QuiltImageDialog';
import { QuiltToolbar } from './components/QuiltToolbar';
import { QuiltListView } from './components/QuiltListView';
import { QuiltGridView } from './components/QuiltGridView';
import { toast } from '@/lib/toast';
import {
  useQuilts,
  useCreateQuilt,
  useUpdateQuilt,
  useDeleteQuilt,
  useUpdateQuiltStatus,
} from '@/hooks/useQuilts';
import { useAppSettings } from '@/hooks/useSettings';
import type { Quilt, SortField, SortDirection, ViewMode, QuiltFormData } from '@/types/quilt';
import type { FilterCriteria } from '@/components/quilts/AdvancedFilters';

export default function QuiltsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearchTerm = searchParams.get('search') || '';

  // State
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [filters, setFilters] = useState<FilterCriteria>({
    seasons: [],
    statuses: [],
    colors: [],
    materials: [],
  });
  const [quiltDialogOpen, setQuiltDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedQuilt, setSelectedQuilt] = useState<Quilt | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const t = useTranslations();
  const locale = useLocale();

  // Data fetching
  const { data: quiltsData, isLoading } = useQuilts();
  const { data: appSettings } = useAppSettings();
  const createQuiltMutation = useCreateQuilt();
  const updateQuiltMutation = useUpdateQuilt();
  const deleteQuiltMutation = useDeleteQuilt();
  const updateQuiltStatusMutation = useUpdateQuiltStatus();

  const quilts: Quilt[] = useMemo(() => quiltsData?.quilts || [], [quiltsData]);

  // Get unique colors and materials
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

  // Filter and sort quilts
  const filteredQuilts = useMemo(() => {
    let result = [...quilts];

    // Search filter
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

    // Advanced filters
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

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        if (sortField === 'weight') {
          const aWeight = a.weightGrams ?? 0;
          const bWeight = b.weightGrams ?? 0;
          return sortDirection === 'asc' ? aWeight - bWeight : bWeight - aWeight;
        }

        if (sortField === 'size') {
          // Sort by area (length × width)
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
  }, [quilts, searchTerm, filters, sortField, sortDirection]);

  // Event handlers
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
    if (!window.confirm(t('quilts.confirmDelete'))) return;

    try {
      await deleteQuiltMutation.mutateAsync({ id: quilt.id });
      toast.success(t('toasts.quiltDeleted'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('quilts.dialogs.unknownError');
      toast.error(t('quilts.dialogs.deleteFailed'), errorMessage);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        t('quilts.dialogs.confirmBatchDelete', { count: selectedIds.size })
      )
    )
      return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteQuiltMutation.mutateAsync({ id })));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      toast.success(t('toasts.quiltDeleted'));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('quilts.dialogs.unknownError');
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
        // Change status
        handleStatusChange(quilt);
        break;
      case 'edit':
        // Edit quilt
        handleEditQuilt(quilt);
        break;
      case 'view':
        // View usage history
        handleViewHistory(quilt);
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  };

  const handleSaveQuilt = async (data: QuiltFormData) => {
    try {
      // Convert purchaseDate string to Date if needed
      const processedData = {
        ...data,
        purchaseDate: data.purchaseDate
          ? typeof data.purchaseDate === 'string'
            ? new Date(data.purchaseDate)
            : data.purchaseDate
          : undefined,
      };

      if (selectedQuilt) {
        await updateQuiltMutation.mutateAsync({ id: selectedQuilt.id, ...processedData });
        toast.success(t('toasts.quiltUpdated'));
      } else {
        await createQuiltMutation.mutateAsync(processedData);
        toast.success(t('toasts.quiltAdded'));
      }
      setQuiltDialogOpen(false);
    } catch (error: unknown) {
      // Extract error message from API error
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('quilts.dialogs.unknownError');
      toast.error(t('quilts.dialogs.saveConfig.error'), errorMessage);
    }
  };

  const handleStatusChangeConfirm = async (
    quiltId: string,
    newStatus: string,
    options?: { startDate?: string; endDate?: string; notes?: string }
  ) => {
    if (!selectedQuilt) return;

    try {
      // Use the atomic status update API
      await updateQuiltStatusMutation.mutateAsync({
        quiltId: quiltId,
        status: newStatus as 'IN_USE' | 'STORAGE' | 'MAINTENANCE',
        usageType: 'REGULAR', // Default to REGULAR, can be extended if needed
        notes: options?.notes,
      });

      toast.success(t('toasts.statusUpdated'));
      setStatusDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('quilts.dialogs.unknownError');
      toast.error(
        t('quilts.dialogs.statusUpdateFailed'),
        errorMessage
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Empty state
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

  // No results state
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

  // Main render
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
