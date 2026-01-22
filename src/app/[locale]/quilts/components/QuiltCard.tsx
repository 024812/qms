import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package, Image as ImageIcon } from 'lucide-react';
import { HighlightText } from '@/components/ui/highlight-text';
import type { Quilt } from '@/types/quilt';
import { useLanguage } from '@/lib/language-provider';
import Image from 'next/image';

interface QuiltCardProps {
  quilt: Quilt;
  searchTerm: string;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: () => void;
  onViewImages?: () => void;
  onDoubleClick?: () => void;
}

export function QuiltCard({
  quilt,
  searchTerm,
  isSelectMode,
  isSelected,
  onSelectToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onViewImages,
  onDoubleClick,
}: QuiltCardProps) {
  const { t, language } = useLanguage();

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'WINTER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUMMER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SPRING_AUTUMN':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return 'bg-green-100 text-green-800';
      case 'STORAGE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onDoubleClick={onDoubleClick}
      title={
        onDoubleClick
          ? language === 'zh'
            ? '双击执行操作'
            : 'Double-click to perform action'
          : undefined
      }
    >
      <CardContent className="p-4">
        {isSelectMode && (
          <div className="mb-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelectToggle}
              className="w-4 h-4 rounded border-gray-300"
            />
          </div>
        )}

        {quilt.mainImage && (
          <div className="mb-3 relative h-40 bg-muted rounded-md overflow-hidden">
            <Image
              src={quilt.mainImage}
              alt={quilt.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">#{quilt.itemNumber}</span>
              </div>
              <h3 className="font-semibold text-foreground">
                <HighlightText text={quilt.name} searchTerm={searchTerm} />
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getSeasonColor(quilt.season)}>
              {t(`season.${quilt.season}`)}
            </Badge>
            <Badge className={getStatusColor(quilt.currentStatus)}>
              {t(`status.${quilt.currentStatus}`)}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              {quilt.lengthCm && quilt.widthCm ? `${quilt.lengthCm}×${quilt.widthCm}cm` : '-'}
            </div>
            <div>
              {quilt.weightGrams ?? '-'}g · {quilt.fillMaterial}
            </div>
            <div>
              {quilt.color} · {quilt.location}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                <Edit className="w-3 h-3 mr-1" />
                {t('common.edit')}
              </Button>
              <Button variant="outline" size="sm" onClick={onStatusChange} className="flex-1">
                {t('quilts.dialogs.changeStatus')}
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            {onViewImages && (
              <Button variant="secondary" size="sm" onClick={onViewImages} className="w-full">
                <ImageIcon className="w-3 h-3 mr-1" />
                {language === 'zh' ? '查看图片' : 'View Images'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
