import { QuiltCard } from './QuiltCard';
import type { Quilt } from '@/types/quilt';

interface QuiltGridViewProps {
  quilts: Quilt[];
  searchTerm: string;
  isSelectMode: boolean;
  selectedIds: Set<string>;
  onSelectToggle: (id: string) => void;
  onEdit: (quilt: Quilt) => void;
  onDelete: (quilt: Quilt) => void;
  onStatusChange: (quilt: Quilt) => void;
  onViewImages?: (quilt: Quilt) => void;
  onDoubleClick?: (quilt: Quilt) => void;
}

export function QuiltGridView({
  quilts,
  searchTerm,
  isSelectMode,
  selectedIds,
  onSelectToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onViewImages,
  onDoubleClick,
}: QuiltGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {quilts.map(quilt => (
        <QuiltCard
          key={quilt.id}
          quilt={quilt}
          searchTerm={searchTerm}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.has(quilt.id)}
          onSelectToggle={() => onSelectToggle(quilt.id)}
          onEdit={() => onEdit(quilt)}
          onDelete={() => onDelete(quilt)}
          onStatusChange={() => onStatusChange(quilt)}
          onViewImages={onViewImages ? () => onViewImages(quilt) : undefined}
          onDoubleClick={onDoubleClick ? () => onDoubleClick(quilt) : undefined}
        />
      ))}
    </div>
  );
}
