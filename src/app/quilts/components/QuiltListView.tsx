import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { QuiltTableRow } from './QuiltTableRow';
import type { Quilt, SortField, SortDirection } from '@/types/quilt';
import { useLanguage } from '@/lib/language-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface QuiltListViewProps {
  quilts: Quilt[];
  searchTerm: string;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onSelectAll: () => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (quilt: Quilt) => void;
  onDelete: (quilt: Quilt) => void;
  onStatusChange: (quilt: Quilt) => void;
  onViewHistory: (quilt: Quilt) => void;
  onViewImages?: (quilt: Quilt) => void;
  onDoubleClick?: (quilt: Quilt) => void;
}

export function QuiltListView({
  quilts,
  searchTerm,
  isSelectMode,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onStatusChange,
  onViewHistory,
  onViewImages,
  onDoubleClick,
}: QuiltListViewProps) {
  const { t } = useLanguage();

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const renderSortableHeader = (field: SortField, label: string) => (
    <TableHead
      key={field}
      className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap"
      onClick={() => onSort(field)}
      title={t('language') === 'zh' ? '点击排序' : 'Click to sort'}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        {renderSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {isSelectMode && (
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  checked={quilts.length > 0 && selectedIds.size === quilts.length}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-gray-300 accent-primary"
                />
              </TableHead>
            )}
            {renderSortableHeader('itemNumber', t('quilts.table.itemNumber'))}
            {renderSortableHeader('name', t('quilts.views.name'))}
            {renderSortableHeader('season', t('quilts.table.season'))}
            {renderSortableHeader('size', t('quilts.table.size'))}
            {renderSortableHeader('weight', t('quilts.table.weight'))}
            {renderSortableHeader('fillMaterial', t('quilts.table.fillMaterial'))}
            {renderSortableHeader('color', t('quilts.table.color'))}
            {renderSortableHeader('location', t('quilts.table.location'))}
            {renderSortableHeader('currentStatus', t('quilts.table.status'))}
            <TableHead className="text-center font-medium">{t('quilts.views.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quilts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isSelectMode ? 11 : 10} className="h-24 text-center">
                {t('common.noResults')}
              </TableCell>
            </TableRow>
          ) : (
            quilts.map(quilt => (
              <QuiltTableRow
                key={quilt.id}
                quilt={quilt}
                searchTerm={searchTerm}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(quilt.id)}
                onSelectToggle={() => onSelectToggle(quilt.id)}
                onEdit={() => onEdit(quilt)}
                onDelete={() => onDelete(quilt)}
                onStatusChange={() => onStatusChange(quilt)}
                onViewHistory={() => onViewHistory(quilt)}
                onViewImages={onViewImages ? () => onViewImages(quilt) : undefined}
                onDoubleClick={onDoubleClick ? () => onDoubleClick(quilt) : undefined}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
