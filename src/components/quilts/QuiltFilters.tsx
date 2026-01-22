'use client';

import { useState, useEffect } from 'react';
import { Season, QuiltStatus } from '@/lib/validations/quilt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Card components removed - not used in this file
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { QuiltFiltersInput } from '@/lib/validations/quilt';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  SlidersHorizontal,
  Snowflake,
  Sun,
  Leaf,
  MapPin,
  Building,
  Weight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface QuiltFiltersProps {
  filters: QuiltFiltersInput;
  onFiltersChange: (filters: QuiltFiltersInput) => void;
  totalCount?: number;
  filteredCount?: number;
}

const SEASON_OPTIONS = [
  { value: Season.WINTER, label: 'Winter', icon: Snowflake, color: 'text-blue-600' },
  { value: Season.SPRING_AUTUMN, label: 'Spring/Autumn', icon: Leaf, color: 'text-green-600' },
  { value: Season.SUMMER, label: 'Summer', icon: Sun, color: 'text-orange-600' },
];

const STATUS_OPTIONS = [
  { value: QuiltStatus.IN_USE, label: 'In Use', color: 'text-blue-600' },
  { value: QuiltStatus.STORAGE, label: 'Storage', color: 'text-gray-600' },
  { value: QuiltStatus.MAINTENANCE, label: 'Maintenance', color: 'text-red-600' },
];

const COMMON_LOCATIONS = [
  'Master Bedroom',
  'Guest Room',
  'Living Room',
  'Bedroom Closet',
  'Linen Closet',
  'Storage Room',
  'Under Bed Storage',
  'Wardrobe',
];

const COMMON_BRANDS = [
  'IKEA',
  'Muji',
  'Uniqlo',
  'Nitori',
  'Francfranc',
  'West Elm',
  'Pottery Barn',
  'Patagonia',
  'REI Co-op',
];

export function QuiltFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: QuiltFiltersProps) {
  const t = useTranslations('quilts.filters');
  const [localFilters, setLocalFilters] = useState<QuiltFiltersInput>(filters);
  const [isOpen, setIsOpen] = useState(false);

  // Debounced filter application
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [localFilters, onFiltersChange]);

  const updateFilter = (key: keyof QuiltFiltersInput, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      season: undefined,
      status: undefined,
      location: undefined,
      brand: undefined,
      minWeight: undefined,
      maxWeight: undefined,
      search: undefined,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(
      value => value !== undefined && value !== '' && value !== null
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={localFilters.search || ''}
          onChange={e => updateFilter('search', e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Season Filter */}
        <div className="flex items-center space-x-1">
          <Label className="text-sm text-muted-foreground">{t('season')}:</Label>
          {SEASON_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = localFilters.season === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('season', isActive ? undefined : option.value)}
                className={cn('h-8', !isActive && option.color)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Status Filter */}
        <div className="flex items-center space-x-1">
          <Label className="text-sm text-muted-foreground">{t('status')}:</Label>
          {STATUS_OPTIONS.map(option => {
            const isActive = localFilters.status === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('status', isActive ? undefined : option.value)}
                className={cn('h-8', !isActive && option.color)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Advanced Filters Toggle */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t('advanced')}
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>{t('advancedFilters')}</SheetTitle>
              <SheetDescription>{t('advancedDescription')}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{t('location')}</span>
                </Label>
                <Select
                  value={localFilters.location || ''}
                  onValueChange={value => updateFilter('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLocation')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allLocations')}</SelectItem>
                    {COMMON_LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_LOCATIONS.slice(0, 4).map(location => (
                    <Badge
                      key={location}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => updateFilter('location', location)}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{t('brand')}</span>
                </Label>
                <Select
                  value={localFilters.brand || ''}
                  onValueChange={value => updateFilter('brand', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBrand')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('allBrands')}</SelectItem>
                    {COMMON_BRANDS.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_BRANDS.slice(0, 6).map(brand => (
                    <Badge
                      key={brand}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => updateFilter('brand', brand)}
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Weight Range */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Weight className="w-4 h-4" />
                  <span>{t('weightRange')}</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('minWeight')}</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      value={localFilters.minWeight || ''}
                      onChange={e =>
                        updateFilter(
                          'minWeight',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('maxWeight')}</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2000"
                      value={localFilters.maxWeight || ''}
                      onChange={e =>
                        updateFilter(
                          'maxWeight',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      updateFilter('minWeight', 0);
                      updateFilter('maxWeight', 800);
                    }}
                  >
                    {t('light')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      updateFilter('minWeight', 800);
                      updateFilter('maxWeight', 1500);
                    }}
                  >
                    {t('medium')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      updateFilter('minWeight', 1500);
                      updateFilter('maxWeight', undefined);
                    }}
                  >
                    {t('heavy')}
                  </Badge>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  {t('clearAll')}
                </Button>
                <Button onClick={() => setIsOpen(false)}>{t('applyFilters')}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            {t('clear')} ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Results Count */}
      {totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {filteredCount !== undefined && filteredCount !== totalCount ? (
            <>
              {t('showingFiltered', { filtered: filteredCount, total: totalCount })}
            </>
          ) : (
            <>{t('showingTotal', { total: totalCount })}</>
          )}
        </div>
      )}
    </div>
  );
}
