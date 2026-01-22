import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, RotateCcw, Grid3x3, List, Trash2 } from 'lucide-react';
import { AdvancedFilters, type FilterCriteria } from '@/components/quilts/AdvancedFilters';
import type { ViewMode } from '@/types/quilt';

import { useLanguage } from '@/lib/language-provider';

interface QuiltToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isSelectMode: boolean;
  onSelectModeToggle: () => void;
  selectedCount: number;
  onBatchDelete: () => void;
  onAddQuilt: () => void;
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  availableColors: string[];
  availableMaterials: string[];
}

export function QuiltToolbar({
  searchTerm,
  onSearchChange,
  onSearchClear,
  viewMode,
  onViewModeChange,
  isSelectMode,
  onSelectModeToggle,
  selectedCount,
  onBatchDelete,
  onAddQuilt,
  filters: _filters,
  onFiltersChange,
  availableColors,
  availableMaterials,
}: QuiltToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder={t('quilts.actions.search')}
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-muted/20 p-1 rounded-lg border">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            title={t('language') === 'zh' ? '列表视图' : 'List View'}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            title={t('language') === 'zh' ? '网格视图' : 'Grid View'}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Add Button */}
        <Button onClick={onAddQuilt} className="shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4 mr-2" />
          {t('quilts.actions.add')}
        </Button>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        onFilterChange={onFiltersChange}
        availableColors={availableColors}
        availableMaterials={availableMaterials}
      />

      {/* Batch Actions Bar */}
      {isSelectMode && (
        <div className="flex items-center justify-between p-3 bg-accent/30 border border-accent rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary">
              {t('language') === 'zh' ? `已选择 ${selectedCount} 项` : `${selectedCount} selected`}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBatchDelete}
              disabled={selectedCount === 0}
              className="shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('quilts.actions.batchDelete')}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onSelectModeToggle}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  );
}
