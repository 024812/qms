'use client';

import { Search, LayoutGrid, List as ListIcon, Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface CardFilterState {
  sport: string;
  gradingCompany: string;
  status: string;
}

interface CardToolbarProps {
  viewMode: 'list' | 'grid';
  onViewChange: (mode: 'list' | 'grid') => void;
  onSearch: (term: string) => void;
  onAdd: () => void;
  filters: CardFilterState;
  onFilterChange: (key: keyof CardFilterState, value: string) => void;
}

export function CardToolbar({
  viewMode,
  onViewChange,
  onSearch,
  onAdd,
  filters,
  onFilterChange,
}: CardToolbarProps) {
  const t = useTranslations('cards');
  const hasActiveFilters =
    filters.sport !== 'ALL' || filters.gradingCompany !== 'ALL' || filters.status !== 'ALL';

  const clearFilters = () => {
    onFilterChange('sport', 'ALL');
    onFilterChange('gradingCompany', 'ALL');
    onFilterChange('status', 'ALL');
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center flex-1 max-w-sm gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('toolbar.searchPlaceholder')}
              className="pl-9"
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                {t('toolbar.filters')}
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 px-1 text-xs h-5">
                    {t('toolbar.active')}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('toolbar.sport')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'ALL'}
                onCheckedChange={() => onFilterChange('sport', 'ALL')}
              >
                {t('toolbar.allSports')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'BASKETBALL'}
                onCheckedChange={() => onFilterChange('sport', 'BASKETBALL')}
              >
                {t('toolbar.basketball')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'SOCCER'}
                onCheckedChange={() => onFilterChange('sport', 'SOCCER')}
              >
                {t('toolbar.soccer')}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('toolbar.grading')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.gradingCompany === 'ALL'}
                onCheckedChange={() => onFilterChange('gradingCompany', 'ALL')}
              >
                {t('toolbar.anyGrading')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.gradingCompany === 'PSA'}
                onCheckedChange={() => onFilterChange('gradingCompany', 'PSA')}
              >
                PSA
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.gradingCompany === 'BGS'}
                onCheckedChange={() => onFilterChange('gradingCompany', 'BGS')}
              >
                BGS
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.gradingCompany === 'UNGRADED'}
                onCheckedChange={() => onFilterChange('gradingCompany', 'UNGRADED')}
              >
                {t('toolbar.ungraded')}
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('toolbar.status')}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'ALL'}
                onCheckedChange={() => onFilterChange('status', 'ALL')}
              >
                {t('toolbar.allStatus')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'COLLECTION'}
                onCheckedChange={() => onFilterChange('status', 'COLLECTION')}
              >
                {t('toolbar.collection')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'FOR_SALE'}
                onCheckedChange={() => onFilterChange('status', 'FOR_SALE')}
              >
                {t('toolbar.forSale')}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'SOLD'}
                onCheckedChange={() => onFilterChange('status', 'SOLD')}
              >
                {t('toolbar.sold')}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title={t('toolbar.clearFilters')}>
              <X className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center border rounded-md bg-background ml-2">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 w-9 px-0 rounded-r-none"
              onClick={() => onViewChange('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-9 w-9 px-0 rounded-l-none border-l"
              onClick={() => onViewChange('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onAdd} className="ml-2">
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.add')}
          </Button>
        </div>
      </div>

      {/* Filter Badges Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('toolbar.activeFilters')}:</span>
          {filters.sport !== 'ALL' && (
            <Badge variant="secondary" className="text-xs">
              {filters.sport}
            </Badge>
          )}
          {filters.gradingCompany !== 'ALL' && (
            <Badge variant="secondary" className="text-xs">
              Grade: {filters.gradingCompany}
            </Badge>
          )}
          {filters.status !== 'ALL' && (
            <Badge variant="secondary" className="text-xs">
              {filters.status}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
