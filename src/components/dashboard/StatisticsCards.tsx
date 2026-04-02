'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Package,
  Clock,
  Calendar,
  Star,
  Activity,
  Target,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface DashboardStats {
  totalQuilts: number;
  quiltsInUse: number;
  storageQuilts: number;
  totalUsageDays: number;
  averageUsageDuration: number;
  mostUsedQuilt?: {
    name: string;
    usageCount: number;
  };
  seasonalDistribution: {
    WINTER: number;
    SPRING_AUTUMN: number;
    SUMMER: number;
  };
  usageFrequency: number;
  averageSatisfaction: number;
  maintenanceAlerts: number;
  storageUtilization: number;
}

interface StatisticsCardsProps {
  stats: DashboardStats;
  previousStats?: DashboardStats;
  isLoading?: boolean;
}

export function StatisticsCards({ stats, previousStats, isLoading = false }: StatisticsCardsProps) {
  const loadingKeys = [
    'stats-skeleton-1',
    'stats-skeleton-2',
    'stats-skeleton-3',
    'stats-skeleton-4',
    'stats-skeleton-5',
    'stats-skeleton-6',
    'stats-skeleton-7',
    'stats-skeleton-8',
  ];

  const getTrendIndicator = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;

    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    const isNeutral = Math.abs(change) < 1;

    if (isNeutral) {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="w-3 h-3 mr-1" />
          <span className="text-xs">No change</span>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center', isPositive ? 'text-green-600' : 'text-red-600')}>
        {isPositive ? (
          <ArrowUpRight className="w-3 h-3 mr-1" />
        ) : (
          <ArrowDownRight className="w-3 h-3 mr-1" />
        )}
        <span className="text-xs">
          {isPositive ? '+' : ''}
          {Math.round(change)}%
        </span>
      </div>
    );
  };

  const utilizationRate =
    stats.totalQuilts > 0 ? Math.round((stats.quiltsInUse / stats.totalQuilts) * 100) : 0;

  const storageRate =
    stats.totalQuilts > 0 ? Math.round((stats.storageQuilts / stats.totalQuilts) * 100) : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingKeys.map(key => (
          <Card key={key} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Quilts */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalQuilts}</p>
                <p className="text-sm text-gray-600">Total Quilts</p>
              </div>
            </div>
            {getTrendIndicator(stats.totalQuilts, previousStats?.totalQuilts)}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Collection Status</span>
              <span>{utilizationRate}% in use</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quilts In Use */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.quiltsInUse}</p>
                <p className="text-sm text-gray-600">Currently In Use</p>
              </div>
            </div>
            {getTrendIndicator(stats.quiltsInUse, previousStats?.quiltsInUse)}
          </div>
          <div className="mt-4">
            <Badge variant={stats.quiltsInUse > 0 ? 'default' : 'secondary'} className="text-xs">
              {stats.quiltsInUse > 0 ? 'Active Usage' : 'No Active Usage'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Storage Quilts */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.storageQuilts}</p>
                <p className="text-sm text-gray-600">In Storage</p>
              </div>
            </div>
            {getTrendIndicator(stats.storageQuilts, previousStats?.storageQuilts)}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Storage</span>
              <span>{storageRate}%</span>
            </div>
            <Progress value={storageRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Total Usage Days */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsageDays}</p>
                <p className="text-sm text-gray-600">Total Usage Days</p>
              </div>
            </div>
            {getTrendIndicator(stats.totalUsageDays, previousStats?.totalUsageDays)}
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-500">
              Avg: {Math.round(stats.averageUsageDuration)} days per use
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Satisfaction */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.averageSatisfaction.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
              </div>
            </div>
            {getTrendIndicator(stats.averageSatisfaction, previousStats?.averageSatisfaction)}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Rating</span>
              <span>{Math.round((stats.averageSatisfaction / 5) * 100)}%</span>
            </div>
            <Progress value={(stats.averageSatisfaction / 5) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Usage Frequency */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{stats.usageFrequency.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Uses per Month</p>
              </div>
            </div>
            {getTrendIndicator(stats.usageFrequency, previousStats?.usageFrequency)}
          </div>
          <div className="mt-4">
            <Badge variant="outline" className="text-xs">
              {stats.usageFrequency > 2
                ? 'High Activity'
                : stats.usageFrequency > 1
                  ? 'Moderate Activity'
                  : 'Low Activity'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Most Used Quilt */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Most Used</p>
              {stats.mostUsedQuilt ? (
                <div>
                  <p className="font-bold text-lg truncate">{stats.mostUsedQuilt.name}</p>
                  <p className="text-xs text-gray-500">{stats.mostUsedQuilt.usageCount} uses</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No usage data</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Alerts */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.maintenanceAlerts}</p>
                <p className="text-sm text-gray-600">Maintenance Alerts</p>
              </div>
            </div>
            {stats.maintenanceAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                Action Needed
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant={stats.maintenanceAlerts > 0 ? 'default' : 'outline'}
              size="sm"
              className="w-full text-xs"
            >
              {stats.maintenanceAlerts > 0 ? 'View Alerts' : 'All Good'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
