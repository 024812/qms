'use client';

import { useTranslations } from 'next-intl';
import { Plus, DollarSign } from 'lucide-react';
import type { ActivityItem } from '@/app/actions/card-overview-data';

interface RecentActivityListProps {
  activities: ActivityItem[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const t = useTranslations('cards.overview');

  if (activities.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
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
    <div className="h-[240px] overflow-y-auto space-y-1 pr-1">
      {activities.map(activity => (
        <div
          key={activity.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          {/* Icon */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{activity.playerName}</p>
            <p className="text-xs text-muted-foreground">
              {activity.type === 'added' ? t('addedLabel') : t('soldLabel')} · {activity.brand}{' '}
              {activity.year}
            </p>
          </div>

          {/* Right side */}
          <div className="text-right shrink-0">
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
