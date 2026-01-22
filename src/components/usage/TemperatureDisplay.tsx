'use client';

import { useHistoricalWeather } from '@/hooks/useHistoricalWeather';
import { useTranslations } from 'next-intl';
import { Thermometer, Loader2 } from 'lucide-react';

interface TemperatureDisplayProps {
  date: Date | string | null | undefined;
  compact?: boolean;
}

export function TemperatureDisplay({ date, compact = false }: TemperatureDisplayProps) {
  const t = useTranslations('usage.temperature');

  // Convert date to YYYY-MM-DD format
  const dateString = date ? new Date(date).toISOString().split('T')[0] : null;

  const { data, isLoading, error } = useHistoricalWeather(dateString);

  if (!dateString) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Thermometer className="w-3 h-3 text-orange-500" />
        {data.temperature.max}°/{data.temperature.min}°
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-xs">
      <Thermometer className="w-3.5 h-3.5 text-orange-500" />
      <div className="flex flex-col">
        <span className="text-foreground">
          {t('high')}:{' '}
          <span className="font-medium text-orange-600 dark:text-orange-400">
            {data.temperature.max}°C
          </span>
        </span>
        <span className="text-foreground">
          {t('low')}:{' '}
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {data.temperature.min}°C
          </span>
        </span>
      </div>
    </div>
  );
}
