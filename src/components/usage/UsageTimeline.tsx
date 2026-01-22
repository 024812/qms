'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Star,
  Thermometer,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface UsagePeriod {
  id: string;
  startDate: Date;
  endDate?: Date | null;
  usageType: string;
  location?: string | null;
  notes?: string | null;
  condition?: string | null;
  satisfactionRating?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  durationDays?: number | null;
  seasonUsed?: string | null;
}

interface UsageTimelineProps {
  usagePeriods: UsagePeriod[];
  quiltName: string;
  showStats?: boolean;
}

const USAGE_TYPE_COLORS = {
  REGULAR: 'bg-blue-100 text-blue-800',
  GUEST: 'bg-green-100 text-green-800',
  SPECIAL_OCCASION: 'bg-purple-100 text-purple-800',
  SEASONAL_ROTATION: 'bg-orange-100 text-orange-800',
};

const CONDITION_COLORS = {
  EXCELLENT: 'text-green-600',
  GOOD: 'text-blue-600',
  FAIR: 'text-yellow-600',
  NEEDS_CLEANING: 'text-orange-600',
  NEEDS_REPAIR: 'text-red-600',
};

export function UsageTimeline({ usagePeriods, quiltName, showStats = true }: UsageTimelineProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [showAllPeriods, setShowAllPeriods] = useState(false);

  const togglePeriodExpansion = (periodId: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(periodId)) {
      newExpanded.delete(periodId);
    } else {
      newExpanded.add(periodId);
    }
    setExpandedPeriods(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDurationText = (period: UsagePeriod) => {
    // Check if durationDays is defined and not null
    if (period.durationDays !== null && period.durationDays !== undefined) {
      if (locale === 'zh') {
        return `${period.durationDays} 天`;
      }
      return `${period.durationDays} day${period.durationDays !== 1 ? 's' : ''}`;
    }

    if (period.endDate) {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (locale === 'zh') {
        return `${diffDays} 天`;
      }
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }

    return t('usage.timeline.ongoing');
  };

  const getUsageStats = () => {
    if (usagePeriods.length === 0) return null;

    const completedPeriods = usagePeriods.filter(p => p.endDate);
    const totalDays = completedPeriods.reduce((sum, period) => {
      if (period.durationDays) return sum + period.durationDays;
      if (period.endDate) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }
      return sum;
    }, 0);

    const avgDuration =
      completedPeriods.length > 0 ? Math.round(totalDays / completedPeriods.length) : 0;
    const avgSatisfaction = completedPeriods
      .filter(p => p.satisfactionRating)
      .reduce((sum, p, _, arr) => sum + p.satisfactionRating! / arr.length, 0);

    const usageTypeCount = usagePeriods.reduce(
      (acc, period) => {
        acc[period.usageType] = (acc[period.usageType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonType = Object.entries(usageTypeCount).sort(([, a], [, b]) => b - a)[0];

    return {
      totalPeriods: usagePeriods.length,
      totalDays,
      avgDuration,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      mostCommonType: mostCommonType ? mostCommonType[0] : null,
    };
  };

  const stats = getUsageStats();
  const displayPeriods = showAllPeriods ? usagePeriods : usagePeriods.slice(0, 5);

  if (usagePeriods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{t('usage.timeline.title')}</span>
          </CardTitle>
          <CardDescription>{t('usage.timeline.description', { quiltName })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t('usage.calendar.noHistory')}</p>
            <p className="text-sm">{t('usage.calendar.startTracking')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{t('usage.timeline.title')}</span>
          </div>
          <Badge variant="outline">
            {usagePeriods.length} {usagePeriods.length === 1 ? t('usage.timeline.period').replace('{count}', '1').split(' ')[1] : t('usage.timeline.periods').replace('{count}', '').trim()}
          </Badge>
        </CardTitle>
        <CardDescription>{t('usage.timeline.description', { quiltName })}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Usage Statistics */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
              <div className="text-xs text-blue-600">{t('usage.statistics.totalDays')}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.avgDuration}</div>
              <div className="text-xs text-green-600">{t('usage.statistics.avgDuration')}</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalPeriods}</div>
              <div className="text-xs text-purple-600">{t('usage.statistics.periods')}</div>
            </div>
            {stats.avgSatisfaction > 0 && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.avgSatisfaction}</div>
                <div className="text-xs text-yellow-600">{t('usage.statistics.avgSatisfaction')}</div>
              </div>
            )}
          </div>
        )}

        {showStats && <Separator />}

        {/* Timeline */}
        <div className="space-y-4">
          {displayPeriods.map((period, index) => {
            const isExpanded = expandedPeriods.has(period.id);
            const isOngoing = !period.endDate;

            return (
              <div key={period.id} className="relative">
                {/* Timeline line */}
                {index < displayPeriods.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-200" />
                )}

                <div className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center',
                      isOngoing
                        ? 'bg-blue-100 border-blue-300 text-blue-600'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    )}
                  >
                    <Clock className="w-4 h-4" />
                  </div>

                  {/* Period content */}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      className="cursor-pointer w-full text-left"
                      onClick={() => togglePeriodExpansion(period.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${period.usageType.replace('_', ' ')} usage period from ${formatDate(period.startDate)}${period.endDate ? ` to ${formatDate(period.endDate)}` : ', ongoing'}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={cn(
                              'text-xs',
                              USAGE_TYPE_COLORS[
                                period.usageType as keyof typeof USAGE_TYPE_COLORS
                              ] || 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {period.usageType.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(period.startDate)}
                            {period.endDate && ` - ${formatDate(period.endDate)}`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getDurationText(period)}
                          </Badge>
                        </div>

                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Basic info always visible */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {period.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" aria-hidden="true" />
                            <span>{period.location}</span>
                          </div>
                        )}
                        {period.satisfactionRating && (
                          <div className="flex items-center space-x-1">
                            <Star
                              className="w-3 h-3 fill-yellow-400 text-yellow-400"
                              aria-hidden="true"
                            />
                            <span>{period.satisfactionRating}/5</span>
                          </div>
                        )}
                        {period.condition && (
                          <div
                            className={cn(
                              'flex items-center space-x-1',
                              CONDITION_COLORS[period.condition as keyof typeof CONDITION_COLORS]
                            )}
                          >
                            <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
                            <span>{period.condition.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">{t('usage.timeline.start')}:</span>
                            <span className="ml-2 text-gray-600">
                              {formatDateTime(period.startDate)}
                            </span>
                          </div>
                          {period.endDate && (
                            <div>
                              <span className="font-medium text-gray-700">{t('usage.timeline.end')}:</span>
                              <span className="ml-2 text-gray-600">
                                {formatDateTime(period.endDate)}
                              </span>
                            </div>
                          )}
                          {period.temperature && (
                            <div className="flex items-center space-x-2">
                              <Thermometer className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{period.temperature}°C</span>
                            </div>
                          )}
                          {period.humidity && (
                            <div className="flex items-center space-x-2">
                              <Droplets className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{period.humidity}%</span>
                            </div>
                          )}
                          {period.seasonUsed && (
                            <div>
                              <span className="font-medium text-gray-700">{t('usage.timeline.season')}:</span>
                              <span className="ml-2 text-gray-600">{period.seasonUsed}</span>
                            </div>
                          )}
                        </div>

                        {period.notes && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-700">{t('usage.timeline.notes')}:</span>
                            </div>
                            <p className="text-gray-600 text-sm pl-6">{period.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more/less button */}
        {usagePeriods.length > 5 && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowAllPeriods(!showAllPeriods)}>
              {showAllPeriods ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  {t('usage.timeline.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {t('usage.timeline.showAll').replace('{count}', usagePeriods.length.toString())}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
