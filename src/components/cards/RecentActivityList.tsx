'use client';

import { DollarSign, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { ActivityItem } from '@/lib/data/cards';

interface RecentActivityListProps {
  activities: ActivityItem[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const t = useTranslations('cards.overview');

  if (activities.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
        {t('noActivity')}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-[240px] space-y-1 overflow-y-auto pr-1">
      {activities.map(activity => (
        <div
          key={activity.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              activity.type === 'added'
                ? 'bg-blue-500/10 text-blue-600'
                : 'bg-green-500/10 text-green-600'
            }`}
          >
            {activity.type === 'added' ? (
              <Plus className="h-4 w-4" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{activity.playerName}</p>
            <p className="text-xs text-muted-foreground">
              {activity.type === 'added' ? t('addedLabel') : t('soldLabel')} - {activity.brand}{' '}
              {activity.year}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={`text-sm font-semibold ${
                activity.type === 'sold' ? 'text-green-600' : ''
              }`}
            >
              ${activity.amount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
