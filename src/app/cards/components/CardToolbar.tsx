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
              placeholder="Search cards..."
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
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 px-1 text-xs h-5">
                    Active
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sport</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'ALL'}
                onCheckedChange={() => onFilterChange('sport', 'ALL')}
              >
                All Sports
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'BASKETBALL'}
                onCheckedChange={() => onFilterChange('sport', 'BASKETBALL')}
              >
                Basketball
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.sport === 'SOCCER'}
                onCheckedChange={() => onFilterChange('sport', 'SOCCER')}
              >
                Soccer
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Grading</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.gradingCompany === 'ALL'}
                onCheckedChange={() => onFilterChange('gradingCompany', 'ALL')}
              >
                Any Grading
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
                Ungraded
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'ALL'}
                onCheckedChange={() => onFilterChange('status', 'ALL')}
              >
                All Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'COLLECTION'}
                onCheckedChange={() => onFilterChange('status', 'COLLECTION')}
              >
                Collection
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'FOR_SALE'}
                onCheckedChange={() => onFilterChange('status', 'FOR_SALE')}
              >
                For Sale
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === 'SOLD'}
                onCheckedChange={() => onFilterChange('status', 'SOLD')}
              >
                Sold
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
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
            Add Card
          </Button>
        </div>
      </div>

      {/* Filter Badges Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active Filters:</span>
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
