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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
      {/* Search and Filters Group */}
      <div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('toolbar.searchPlaceholder')}
            className="pl-9 w-full bg-slate-50 border-slate-200 focus-visible:ring-slate-400"
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        {/* Quick Sport Filter Pill */}
        <Select value={filters.sport} onValueChange={val => onFilterChange('sport', val)}>
          <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
            <SelectValue placeholder={t('toolbar.allSports')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('toolbar.allSports')}</SelectItem>
            <SelectItem value="BASKETBALL">{t('toolbar.basketball')}</SelectItem>
            <SelectItem value="SOCCER">{t('toolbar.soccer')}</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 bg-slate-50 border-slate-200">
              <Filter className="mr-2 h-4 w-4" />
              {t('toolbar.filters')}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 px-1 text-xs h-5 bg-slate-200">
                  {t('toolbar.active')}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            title={t('toolbar.clearFilters')}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Actions and View Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border rounded-md bg-slate-50 p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 px-0 rounded-sm"
            onClick={() => onViewChange('list')}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 px-0 rounded-sm"
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={onAdd} className="h-10 px-6">
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.add')}
        </Button>
      </div>
    </div>
  );
}
