import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, History, Eye, Image as ImageIcon } from 'lucide-react';
import { HighlightText } from '@/components/ui/highlight-text';
import type { Quilt } from '@/types/quilt';
import { useLanguage } from '@/lib/language-provider';
import { TableRow, TableCell } from '@/components/ui/table';

interface QuiltTableRowProps {
  quilt: Quilt;
  searchTerm: string;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: () => void;
  onViewHistory: () => void;
  onViewImages?: () => void;
  onDoubleClick?: () => void;
}

export function QuiltTableRow({
  quilt,
  searchTerm,
  isSelectMode,
  isSelected,
  onSelectToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onViewHistory,
  onViewImages,
  onDoubleClick,
}: QuiltTableRowProps) {
  const { t, language } = useLanguage();

  const getSeasonVariant = (
    season: string
  ):
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral' => {
    switch (season) {
      case 'WINTER':
        return 'info';
      case 'SUMMER':
        return 'warning';
      case 'SPRING_AUTUMN':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getStatusVariant = (
    status: string
  ):
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral' => {
    switch (status) {
      case 'IN_USE':
        return 'success';
      case 'STORAGE':
        return 'neutral';
      case 'MAINTENANCE':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <TableRow
      className="cursor-pointer"
      onDoubleClick={onDoubleClick}
      title={
        onDoubleClick
          ? language === 'zh'
            ? '双击执行操作'
            : 'Double-click to perform action'
          : undefined
      }
    >
      {isSelectMode && (
        <TableCell className="w-12 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelectToggle}
            className="w-4 h-4 rounded border-gray-300 accent-primary"
          />
        </TableCell>
      )}
      <TableCell className="text-center font-medium">
        <span className="font-mono text-xs text-muted-foreground">#</span>
        {quilt.itemNumber}
      </TableCell>
      <TableCell className="text-center">
        <HighlightText text={quilt.name} searchTerm={searchTerm} />
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={getSeasonVariant(quilt.season)}>{t(`season.${quilt.season}`)}</Badge>
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {quilt.lengthCm && quilt.widthCm ? (
          <span className="font-mono text-xs">
            {quilt.lengthCm}×{quilt.widthCm}
            <span className="text-muted-foreground/60">cm</span>
          </span>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {quilt.weightGrams ? (
          <span className="font-mono text-xs">
            {quilt.weightGrams}
            <span className="text-muted-foreground/60">g</span>
          </span>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">
        {quilt.fillMaterial}
      </TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">{quilt.color}</TableCell>
      <TableCell className="text-center text-sm text-muted-foreground">{quilt.location}</TableCell>
      <TableCell className="text-center">
        <Badge variant={getStatusVariant(quilt.currentStatus)}>
          {t(`status.${quilt.currentStatus}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {onViewImages && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={e => {
                e.stopPropagation();
                onViewImages();
              }}
              title={language === 'zh' ? '查看图片' : 'View Images'}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={e => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={e => {
              e.stopPropagation();
              onStatusChange();
            }}
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={e => {
              e.stopPropagation();
              onViewHistory();
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={e => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
