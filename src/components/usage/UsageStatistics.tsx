'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Thermometer,
  Droplets,
  MapPin,
  User,
  Target,
  Award,
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

interface UsageStatisticsProps {
  usagePeriods: UsagePeriod[];
  quiltName: string;
}

export function UsageStatistics({ usagePeriods, quiltName }: UsageStatisticsProps) {
  const t = useTranslations('usage.statistics');
  const stats = useMemo(() => {
    if (usagePeriods.length === 0) return null;

    const completedPeriods = usagePeriods.filter(p => p.endDate);
    const ongoingPeriods = usagePeriods.filter(p => !p.endDate);

    // Duration statistics
    const durations = completedPeriods
      .map(period => {
        if (period.durationDays) return period.durationDays;
        if (period.endDate) {
          const start = new Date(period.startDate);
          const end = new Date(period.endDate);
          const diffMs = end.getTime() - start.getTime();
          return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
        return 0;
      })
      .filter(d => d > 0);

    const totalDays = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = durations.length > 0 ? totalDays / durations.length : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

    // Usage type distribution
    const usageTypeCount = usagePeriods.reduce(
      (acc, period) => {
        acc[period.usageType] = (acc[period.usageType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Location distribution
    const locationCount = usagePeriods
      .filter(p => p.location)
      .reduce(
        (acc, period) => {
          acc[period.location!] = (acc[period.location!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    // Satisfaction statistics
    const satisfactionRatings = completedPeriods
      .filter(p => p.satisfactionRating)
      .map(p => p.satisfactionRating!);

    const avgSatisfaction =
      satisfactionRatings.length > 0
        ? satisfactionRatings.reduce((sum, r) => sum + r, 0) / satisfactionRatings.length
        : 0;

    // Environmental conditions
    const temperatures = usagePeriods.filter(p => p.temperature).map(p => p.temperature!);

    const humidities = usagePeriods.filter(p => p.humidity).map(p => p.humidity!);

    const avgTemperature =
      temperatures.length > 0
        ? temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length
        : 0;

    const avgHumidity =
      humidities.length > 0 ? humidities.reduce((sum, h) => sum + h, 0) / humidities.length : 0;

    // Seasonal usage
    const seasonCount = usagePeriods
      .filter(p => p.seasonUsed)
      .reduce(
        (acc, period) => {
          acc[period.seasonUsed!] = (acc[period.seasonUsed!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    // Condition tracking
    const conditionCount = completedPeriods
      .filter(p => p.condition)
      .reduce(
        (acc, period) => {
          acc[period.condition!] = (acc[period.condition!] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    // Usage frequency (periods per month)
    const firstUsage =
      usagePeriods.length > 0
        ? new Date(Math.min(...usagePeriods.map(p => new Date(p.startDate).getTime())))
        : new Date();
    const monthsSinceFirst = (Date.now() - firstUsage.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const usageFrequency = monthsSinceFirst > 0 ? usagePeriods.length / monthsSinceFirst : 0;

    return {
      totalPeriods: usagePeriods.length,
      completedPeriods: completedPeriods.length,
      ongoingPeriods: ongoingPeriods.length,
      totalDays,
      avgDuration: Math.round(avgDuration * 10) / 10,
      minDuration,
      maxDuration,
      usageTypeCount,
      locationCount,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      satisfactionRatings,
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      avgHumidity: Math.round(avgHumidity * 10) / 10,
      seasonCount,
      conditionCount,
      usageFrequency: Math.round(usageFrequency * 10) / 10,
      firstUsage,
    };
  }, [usagePeriods]);

  if (!stats || usagePeriods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{t('title')}</span>
          </CardTitle>
          <CardDescription>{t('description', { quiltName })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t('noData')}</p>
            <p className="text-sm">{t('startTracking')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to remove unused variables warning if needed, but here we just use what we have.
  // Using direct translation strings for specific stats keys that were added.

  const mostUsedType = Object.entries(stats.usageTypeCount).sort(([, a], [, b]) => b - a)[0];

  const mostUsedLocation = Object.entries(stats.locationCount).sort(([, a], [, b]) => b - a)[0];

  const mostUsedSeason = Object.entries(stats.seasonCount).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>{t('overview')}</span>
          </CardTitle>
          <CardDescription>{t('description', { quiltName })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.totalPeriods}</div>
              <div className="text-sm text-blue-600">{t('totalUses')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{stats.totalDays}</div>
              <div className="text-sm text-green-600">{t('totalDays')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{stats.avgDuration}</div>
              <div className="text-sm text-purple-600">{t('avgDuration')}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{stats.usageFrequency}</div>
              <div className="text-sm text-orange-600">{t('usageFrequency')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{t('usageTypes')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.usageTypeCount).map(([type, count]) => {
              const percentage = (count / stats.totalPeriods) * 100;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{type.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <Badge variant="outline">{Math.round(percentage)}%</Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {mostUsedType && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {t('mostCommon', { type: mostUsedType[0].replace('_', ' '), count: mostUsedType[1] })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locations */}
        {Object.keys(stats.locationCount).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>{t('locations')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.locationCount).map(([location, count]) => {
                const percentage = (count / stats.totalPeriods) * 100;
                return (
                  <div key={location} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{location}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{count}</span>
                        <Badge variant="outline">{Math.round(percentage)}%</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              {mostUsedLocation && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      {t('mostUsedLocation', { location: mostUsedLocation[0], count: mostUsedLocation[1] })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfaction & Condition */}
        {(stats.avgSatisfaction > 0 || Object.keys(stats.conditionCount).length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>{t('performance')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.avgSatisfaction > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t('avgSatisfaction')}</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {stats.avgSatisfaction}/5
                    </Badge>
                  </div>
                  <Progress value={(stats.avgSatisfaction / 5) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{t('poor')}</span>
                    <span>{t('excellent')}</span>
                  </div>
                </div>
              )}

              {Object.keys(stats.conditionCount).length > 0 && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="text-sm font-medium mb-3">{t('postUseCondition')}</h4>
                  {Object.entries(stats.conditionCount).map(([condition, count]) => {
                    const percentage = (count / stats.completedPeriods) * 100;
                    return (
                      <div key={condition} className="flex justify-between items-center mb-2">
                        <span className="text-sm">{condition.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">{count}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(percentage)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Environmental Conditions */}
        {(stats.avgTemperature > 0 || stats.avgHumidity > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5" />
                <span>{t('environmental')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.avgTemperature > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">{t('avgTemp')}</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">{stats.avgTemperature}°C</Badge>
                </div>
              )}

              {stats.avgHumidity > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{t('avgHumidity')}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{stats.avgHumidity}%</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Duration Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{t('durationAnalysis')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.minDuration}</div>
              <div className="text-xs text-gray-600">{t('shortestUse')}</div>
              <div className="text-xs text-gray-500">{t('days')}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.maxDuration}</div>
              <div className="text-xs text-gray-600">{t('longestUse')}</div>
              <div className="text-xs text-gray-500">{t('days')}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.avgDuration}</div>
              <div className="text-xs text-gray-600">{t('avgUse')}</div>
              <div className="text-xs text-gray-500">{t('days')}</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.completedPeriods}</div>
              <div className="text-xs text-gray-600">{t('completedPeriods')}</div>
              <div className="text-xs text-gray-500">{t('periods')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Usage */}
      {Object.keys(stats.seasonCount).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{t('seasonal')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.seasonCount).map(([season, count]) => {
              const percentage = (count / stats.totalPeriods) * 100;
              return (
                <div key={season} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{season}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <Badge variant="outline">{Math.round(percentage)}%</Badge>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            {mostUsedSeason && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    {t('peakSeason', { season: mostUsedSeason[0], count: mostUsedSeason[1] })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
