import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';

export interface FilterCriteria {
  seasons: string[];
  statuses: string[];
  minWeight?: number;
  maxWeight?: number;
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;
  colors: string[];
  materials: string[];
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterCriteria) => void;
  availableColors: string[];
  availableMaterials: string[];
}

const STORAGE_KEY = 'qms-quilt-filters';

export function AdvancedFilters({
  onFilterChange,
  availableColors,
  availableMaterials,
}: AdvancedFiltersProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    seasons: [],
    statuses: [],
    colors: [],
    materials: [],
  });

  // Load saved filters from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Use setTimeout to avoid setState in effect warning
        setTimeout(() => {
          setFilters(parsed);
          onFilterChange(parsed);
        }, 0);
      }
    } catch {
      // Error loading saved filters - use defaults
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    } catch {
      // Error saving filters - continue without saving
    }
  };

  const handleSeasonToggle = (season: string) => {
    const newSeasons = filters.seasons.includes(season)
      ? filters.seasons.filter(s => s !== season)
      : [...filters.seasons, season];
    handleFilterChange({ ...filters, seasons: newSeasons });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    handleFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    handleFilterChange({ ...filters, colors: newColors });
  };

  const handleMaterialToggle = (material: string) => {
    const newMaterials = filters.materials.includes(material)
      ? filters.materials.filter(m => m !== material)
      : [...filters.materials, material];
    handleFilterChange({ ...filters, materials: newMaterials });
  };

  const handleClearAll = () => {
    const emptyFilters: FilterCriteria = {
      seasons: [],
      statuses: [],
      colors: [],
      materials: [],
    };
    handleFilterChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.seasons.length;
    count += filters.statuses.length;
    count += filters.colors.length;
    count += filters.materials.length;
    if (filters.minWeight !== undefined || filters.maxWeight !== undefined) count++;
    if (filters.minLength !== undefined || filters.maxLength !== undefined) count++;
    if (filters.minWidth !== undefined || filters.maxWidth !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          {t('quilts.filters.advancedFilters')}
          {activeCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('quilts.filters.advancedFilters')}</SheetTitle>
          <SheetDescription>
            {t('quilts.filters.advancedDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Season Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('quilts.filters.season')}
            </Label>
            <div className="space-y-2">
              {['WINTER', 'SPRING_AUTUMN', 'SUMMER'].map(season => (
                <div key={season} className="flex items-center space-x-2">
                  <Checkbox
                    id={`season-${season}`}
                    checked={filters.seasons.includes(season)}
                    onCheckedChange={() => handleSeasonToggle(season)}
                  />
                  <label
                    htmlFor={`season-${season}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t(`season.${season}`)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('quilts.filters.status')}
            </Label>
            <div className="space-y-2">
              {['IN_USE', 'STORAGE', 'MAINTENANCE'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t(`status.${status}`)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Weight Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('quilts.filters.weightRange')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="minWeight" className="text-xs text-gray-500">
                  {t('quilts.filters.min')}
                </Label>
                <Input
                  id="minWeight"
                  type="number"
                  placeholder="0"
                  value={filters.minWeight || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      minWeight: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxWeight" className="text-xs text-gray-500">
                  {t('quilts.filters.max')}
                </Label>
                <Input
                  id="maxWeight"
                  type="number"
                  placeholder="5000"
                  value={filters.maxWeight || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      maxWeight: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Size Range - Length */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('quilts.filters.lengthRange')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="minLength" className="text-xs text-gray-500">
                  {t('quilts.filters.min')}
                </Label>
                <Input
                  id="minLength"
                  type="number"
                  placeholder="0"
                  value={filters.minLength || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      minLength: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxLength" className="text-xs text-gray-500">
                  {t('quilts.filters.max')}
                </Label>
                <Input
                  id="maxLength"
                  type="number"
                  placeholder="300"
                  value={filters.maxLength || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      maxLength: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Size Range - Width */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t('quilts.filters.widthRange')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="minWidth" className="text-xs text-gray-500">
                  {t('quilts.filters.min')}
                </Label>
                <Input
                  id="minWidth"
                  type="number"
                  placeholder="0"
                  value={filters.minWidth || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      minWidth: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxWidth" className="text-xs text-gray-500">
                  {t('quilts.filters.max')}
                </Label>
                <Input
                  id="maxWidth"
                  type="number"
                  placeholder="300"
                  value={filters.maxWidth || ''}
                  onChange={e =>
                    handleFilterChange({
                      ...filters,
                      maxWidth: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Color Filter */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t('quilts.filters.color')}
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableColors.map(color => (
                  <div key={color} className="flex items-center space-x-2">
                    <Checkbox
                      id={`color-${color}`}
                      checked={filters.colors.includes(color)}
                      onCheckedChange={() => handleColorToggle(color)}
                    />
                    <label
                      htmlFor={`color-${color}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {color}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Material Filter */}
          {availableMaterials.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t('quilts.filters.fillMaterial')}
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableMaterials.map(material => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${material}`}
                      checked={filters.materials.includes(material)}
                      onCheckedChange={() => handleMaterialToggle(material)}
                    />
                    <label
                      htmlFor={`material-${material}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {material}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            {t('quilts.filters.clearAll')}
          </Button>
          <Button onClick={() => setOpen(false)} className="flex-1">
            {t('quilts.filters.applyFilters')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
