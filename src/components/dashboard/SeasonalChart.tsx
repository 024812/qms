'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Snowflake, Sun, Leaf, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

interface SeasonalData {
  WINTER: number;
  SPRING_AUTUMN: number;
  SUMMER: number;
}

interface SeasonalChartProps {
  data: SeasonalData;
  totalQuilts: number;
  isLoading?: boolean;
}

export function SeasonalChart({ data, totalQuilts, isLoading = false }: SeasonalChartProps) {
  const loadingKeys = ['season-skeleton-1', 'season-skeleton-2', 'season-skeleton-3'];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {loadingKeys.map(key => (
                <div key={key} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const seasons = [
    {
      key: 'WINTER' as keyof SeasonalData,
      name: 'Winter',
      icon: Snowflake,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      count: data.WINTER,
    },
    {
      key: 'SPRING_AUTUMN' as keyof SeasonalData,
      name: 'Spring/Autumn',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      count: data.SPRING_AUTUMN,
    },
    {
      key: 'SUMMER' as keyof SeasonalData,
      name: 'Summer',
      icon: Sun,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      count: data.SUMMER,
    },
  ];

  const maxCount = Math.max(...seasons.map(s => s.count));
  const getPercentage = (count: number) =>
    totalQuilts > 0 ? Math.round((count / totalQuilts) * 100) : 0;
  const getBarHeight = (count: number) =>
    maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Seasonal Distribution
        </CardTitle>
        <CardDescription>Distribution of quilts by season and usage patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bar Chart Visualization */}
          <div className="relative">
            <div className="flex items-end justify-between h-32 mb-4">
              {seasons.map(season => (
                <div key={season.key} className="flex flex-col items-center flex-1 mx-2">
                  <div className="relative w-full max-w-16">
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-all duration-500 ease-in-out',
                        season.bgColor,
                        season.borderColor,
                        'border-2 border-b-0'
                      )}
                      style={{ height: `${getBarHeight(season.count)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs font-medium text-foreground">{season.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between">
              {seasons.map(season => (
                <div key={season.key} className="flex flex-col items-center flex-1 mx-2">
                  <div className={cn('p-2 rounded-full mb-1', season.bgColor)}>
                    <season.icon className={cn('h-4 w-4', season.color)} />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">{season.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            {seasons.map(season => (
              <div
                key={season.key}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md',
                  season.bgColor,
                  season.borderColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <season.icon className={cn('h-5 w-5', season.color)} />
                  <Badge variant="secondary" className="text-xs">
                    {getPercentage(season.count)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{season.count}</p>
                  <p className="text-xs text-muted-foreground">{season.name} Quilts</p>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-foreground">Seasonal Insights</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {maxCount > 0 && (
                <p>
                  • Most quilts are for{' '}
                  <span className="font-medium">
                    {seasons.find(s => s.count === maxCount)?.name}
                  </span>{' '}
                  season ({getPercentage(maxCount)}%)
                </p>
              )}
              {totalQuilts > 0 && (
                <p>
                  • Collection covers all seasons with{' '}
                  <span className="font-medium">{seasons.filter(s => s.count > 0).length}</span>{' '}
                  seasonal categories
                </p>
              )}
              {data.WINTER > 0 && data.SUMMER > 0 && (
                <p>
                  • Good seasonal balance between winter ({data.WINTER}) and summer ({data.SUMMER})
                  quilts
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // View seasonal details
              }}
            >
              <PieChart className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                // View usage trends
              }}
            >
              <Activity className="h-4 w-4 mr-2" />
              Usage Trends
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
