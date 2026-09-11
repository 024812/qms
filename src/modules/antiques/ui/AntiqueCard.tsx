/**
 * Antique Card Component
 *
 * Display component for antique items in list view.
 */

import React from 'react';
import type { AntiqueItem } from '../schema';

interface AntiqueCardProps {
  item: AntiqueItem;
}

export function AntiqueCard({ item }: AntiqueCardProps) {
  const categoryMap: Record<string, string> = {
    JADE: '玉器',
    WOOD: '木器',
    CERAMIC: '陶瓷',
    METAL: '金属',
    STONE: '石器',
    PAPER: '纸品',
    OTHER: '其他',
  };

  const statusMap: Record<string, string> = {
    COLLECTION: '收藏中',
    FOR_SALE: '待售',
    SOLD: '已售出',
    DISPLAY: '展示中',
    APPRAISAL: '鉴定中',
  };

  const formatValue = (value: string | null) => {
    if (!value) return null;
    const num = parseFloat(value);
    return `¥${num.toLocaleString()}`;
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {item.mainImage && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          <img src={item.mainImage} alt={item.name} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <span className="text-xs text-muted-foreground">#{item.itemNumber}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
            {categoryMap[item.category]}
          </span>
          <span className="rounded bg-secondary px-2 py-0.5">{statusMap[item.status]}</span>
        </div>

        {item.material && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">材质：</span>
            {item.material}
          </p>
        )}

        {(item.era || item.dynasty) && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">年代：</span>
            {[item.dynasty, item.era].filter(Boolean).join(' · ')}
          </p>
        )}

        {item.currentValue && (
          <p className="text-sm font-semibold text-green-600">{formatValue(item.currentValue)}</p>
        )}

        {item.location && <p className="text-xs text-muted-foreground">📍 {item.location}</p>}
      </div>
    </div>
  );
}
