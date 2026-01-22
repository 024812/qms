'use client';

import { useTranslations } from 'next-intl';
import { Calendar, History, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface UsageEmptyStateProps {
  type: 'no-active-usage' | 'no-history' | 'no-quilt-selected';
  onStartUsing?: () => void;
  onSelectQuilt?: () => void;
}

export function UsageEmptyState({ type, onStartUsing, onSelectQuilt }: UsageEmptyStateProps) {
  const t = useTranslations();

  if (type === 'no-active-usage') {
    return (
      <EmptyState
        icon={Calendar}
        title={t('usage.tracker.noActiveUsage')}
        description={t('usage.tracker.noActiveUsageDescription')}
        action={
          onStartUsing
            ? {
                label: t('usage.actions.startUsing'),
                onClick: onStartUsing,
              }
            : undefined
        }
      />
    );
  }

  if (type === 'no-history') {
    return (
      <EmptyState
        icon={History}
        title={t('usage.noUsageHistory')}
        description={t('usage.noUsageHistoryDescription')}
        size="sm"
      />
    );
  }

  if (type === 'no-quilt-selected') {
    return (
      <EmptyState
        icon={Package}
        title={t('usage.selection.title')}
        description={t('usage.selection.prompt')}
        action={
          onSelectQuilt
            ? {
                label: t('common.viewDetails'),
                onClick: onSelectQuilt,
                variant: 'outline',
              }
            : undefined
        }
      />
    );
  }

  return null;
}
