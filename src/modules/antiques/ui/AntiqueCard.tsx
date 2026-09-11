/**
 * Antique Card Component
 *
 * Display component for antique items in list view.
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import type { AntiqueItem } from '../schema';

interface AntiqueCardProps {
  item: AntiqueItem;
}

export function AntiqueCard({ item }: AntiqueCardProps) {
  const t = useTranslations('antiques');

  const formatValue = (value: string | null) => {
    if (!value) return null;
    const num = parseFloat(value);
    return `¥${num.toLocaleString()}`;
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {item.mainImage && (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {t(`enums.category.${item.category}`)}
          </span>
          <span className="rounded bg-secondary px-2 py-0.5">
            {t(`enums.status.${item.status}`)}
          </span>
        </div>

        {item.material && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{t('fields.material.label')}:</span>
            {item.material}
          </p>
        )}

        {(item.era || item.dynasty) && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{t('fields.era.label')}:</span>
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
