'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Package,
  PieChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  filterByRecommendation,
  sortByUsageFrequency,
  type QuiltUsageStats,
} from '@/lib/usage-statistics';
import type { SeasonalCounts } from '@/lib/data/stats';

interface AnalyticsClientData {
  overview: {
    totalQuilts: number;
    totalUsagePeriods: number;
    totalUsageDays: number;
    averageUsageDays: number;
    currentlyInUse: number;
  };
  statusDistribution: {
    IN_USE: number;
    STORAGE: number;
    MAINTENANCE: number;
  };
  seasonDistribution: SeasonalCounts;
  usageBySeason: SeasonalCounts;
  mostUsedQuilts: Array<{
    quiltId: string;
    name: string;
    usageCount: number;
    totalDays: number;
    averageDays: number;
  }>;
  usageByYear: Array<{ year: number; count: number }>;
  usageByMonth: Array<{ month: string; count: number }>;
}

interface AnalyticsPageClientProps {
  initialAnalytics: AnalyticsClientData;
  initialUsageStats: QuiltUsageStats[];
}

export function AnalyticsPageClient({
  initialAnalytics,
  initialUsageStats,
}: AnalyticsPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isZh = locale === 'zh';

  const [period, setPeriod] = useState<'30days' | '90days' | '365days' | 'all'>('365days');
  const [filter, setFilter] = useState<'all' | 'keep' | 'low_usage' | 'consider_removal'>('all');

  const filteredStats = useMemo(() => {
    const filtered = filterByRecommendation(initialUsageStats, filter);
    return sortByUsageFrequency(filtered, period, 'desc');
  }, [filter, initialUsageStats, period]);

  const recommendationCounts = useMemo(
    () => ({
      keep: initialUsageStats.filter(stat => stat.recommendation === 'keep').length,
      low_usage: initialUsageStats.filter(stat => stat.recommendation === 'low_usage').length,
      consider_removal: initialUsageStats.filter(stat => stat.recommendation === 'consider_removal')
        .length,
    }),
    [initialUsageStats]
  );

  const getPeriodLabel = (value: string) => {
    const labels: Record<string, { en: string; zh: string }> = {
      '30days': { en: '30 Days', zh: '30天' },
      '90days': { en: '90 Days', zh: '90天' },
      '365days': { en: '365 Days', zh: '365天' },
      all: { en: 'All Time', zh: '全部' },
    };
    return labels[value]?.[isZh ? 'zh' : 'en'] || value;
  };

  const getUsageCount = (stat: QuiltUsageStats) => {
    switch (period) {
      case '30days':
        return stat.usageCount30Days;
      case '90days':
        return stat.usageCount90Days;
      case '365days':
        return stat.usageCount365Days;
      case 'all':
      default:
        return stat.totalUsageCount;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            {isZh ? '数据概览' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <PieChart className="mr-2 h-4 w-4" />
            {isZh ? '状态分布' : 'Distribution'}
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <Award className="mr-2 h-4 w-4" />
            {isZh ? '使用排行' : 'Rankings'}
          </TabsTrigger>
          <TabsTrigger value="frequency">
            <BarChart3 className="mr-2 h-4 w-4" />
            {isZh ? '使用频率分析' : 'Usage Frequency'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-3xl font-bold">{initialAnalytics.overview.totalQuilts}</p>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalQuilts')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Activity className="h-10 w-10 text-green-600" />
                  <div>
                    <p className="text-3xl font-bold">
                      {initialAnalytics.overview.totalUsagePeriods}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('analytics.usageRecords')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-10 w-10 text-purple-600" />
                  <div>
                    <p className="text-3xl font-bold">{initialAnalytics.overview.totalUsageDays}</p>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalUsageDays')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-10 w-10 text-orange-600" />
                  <div>
                    <p className="text-3xl font-bold">
                      {initialAnalytics.overview.averageUsageDays}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('analytics.avgUsageDays')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>{isZh ? '各季节被子使用情况' : 'Usage by Season'}</span>
              </CardTitle>
              <CardDescription>
                {isZh ? '不同季节类型被子的使用次数' : 'Usage count by quilt season'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(initialAnalytics.usageBySeason).map(([season, count]) => (
                  <div key={season} className="rounded-lg bg-gray-50 p-6 text-center">
                    <p className="mb-2 text-3xl font-bold text-blue-600">{count}</p>
                    <p className="text-sm font-semibold">{t(`season.${season}`)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{isZh ? '次使用' : 'uses'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>{t('analytics.statusDistribution')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(initialAnalytics.statusDistribution).map(([status, count]) => {
                    const total = initialAnalytics.overview.totalQuilts;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t(`status.${status}`)}</span>
                          <span className="font-semibold">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              status === 'IN_USE'
                                ? 'bg-blue-500'
                                : status === 'STORAGE'
                                  ? 'bg-gray-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>{t('analytics.seasonDistribution')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(initialAnalytics.seasonDistribution).map(([season, count]) => {
                    const total = initialAnalytics.overview.totalQuilts;
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={season} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{t(`season.${season}`)}</span>
                          <span className="font-semibold">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              season === 'WINTER'
                                ? 'bg-blue-500'
                                : season === 'SUMMER'
                                  ? 'bg-orange-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>{t('analytics.mostUsedQuilts')}</span>
              </CardTitle>
              <CardDescription>{t('analytics.topByUsageCount')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialAnalytics.mostUsedQuilts.map((quilt, index) => (
                  <div
                    key={quilt.quiltId}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-semibold">{quilt.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t('analytics.avg')}: {quilt.averageDays} {t('analytics.days')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-600">{quilt.usageCount}</span>
                      <span className="ml-1 text-sm text-muted-foreground">
                        {t('analytics.uses')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>{t('analytics.usageTrendByYear')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialAnalytics.usageByYear.map(item => {
                  const maxCount = Math.max(
                    ...initialAnalytics.usageByYear.map(year => year.count),
                    0
                  );
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={item.year} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{item.year}</span>
                        <span className="text-muted-foreground">
                          {item.count} {isZh ? '次' : 'uses'}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-200">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequency" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  {isZh ? '正常使用' : 'Normal Usage'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{recommendationCounts.keep}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isZh ? '使用频率正常的被子' : 'Quilts with normal usage'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  {isZh ? '低使用率' : 'Low Usage'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {recommendationCounts.low_usage}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isZh ? '使用频率较低的被子' : 'Quilts with low usage'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  {isZh ? '建议淘汰' : 'Consider Removal'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {recommendationCounts.consider_removal}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isZh ? '建议考虑淘汰的被子' : 'Quilts to consider removing'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isZh ? '使用频率排行榜' : 'Usage Frequency Ranking'}</CardTitle>
                  <CardDescription>
                    {isZh
                      ? '按使用频率排序，显示被子使用情况'
                      : 'Sorted by usage frequency, showing quilt usage patterns'}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={period}
                    onValueChange={(value: '30days' | '90days' | '365days' | 'all') =>
                      setPeriod(value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">{isZh ? '30天' : '30 Days'}</SelectItem>
                      <SelectItem value="90days">{isZh ? '90天' : '90 Days'}</SelectItem>
                      <SelectItem value="365days">{isZh ? '365天' : '365 Days'}</SelectItem>
                      <SelectItem value="all">{isZh ? '全部' : 'All Time'}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter}
                    onValueChange={(value: 'all' | 'keep' | 'low_usage' | 'consider_removal') =>
                      setFilter(value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isZh ? '全部' : 'All'}</SelectItem>
                      <SelectItem value="keep">{isZh ? '正常使用' : 'Normal Usage'}</SelectItem>
                      <SelectItem value="low_usage">{isZh ? '低使用率' : 'Low Usage'}</SelectItem>
                      <SelectItem value="consider_removal">
                        {isZh ? '建议淘汰' : 'Consider Removal'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold uppercase">
                        {isZh ? '排名' : 'Rank'}
                      </TableHead>
                      <TableHead className="font-bold uppercase">
                        {isZh ? '编号' : 'Item #'}
                      </TableHead>
                      <TableHead className="font-bold uppercase">
                        {isZh ? '名称' : 'Name'}
                      </TableHead>
                      <TableHead className="font-bold uppercase">
                        {isZh ? '季节' : 'Season'}
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase">
                        {isZh
                          ? `使用次数 (${getPeriodLabel(period)})`
                          : `Usage Count (${getPeriodLabel(period)})`}
                      </TableHead>
                      <TableHead className="text-center font-bold uppercase">
                        {isZh ? '最后使用' : 'Last Used'}
                      </TableHead>
                      <TableHead className="font-bold uppercase">
                        {isZh ? '建议' : 'Recommendation'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          {isZh ? '暂无数据' : 'No data available'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStats.map((stat, index) => (
                        <TableRow
                          key={stat.quiltId}
                          className={`transition-colors hover:bg-gray-50 ${
                            stat.recommendation === 'consider_removal'
                              ? 'bg-red-50 hover:bg-red-100'
                              : ''
                          } ${
                            stat.recommendation === 'low_usage'
                              ? 'bg-yellow-50 hover:bg-yellow-100'
                              : ''
                          }`}
                        >
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell>#{stat.itemNumber}</TableCell>
                          <TableCell className="font-medium">{stat.quiltName}</TableCell>
                          <TableCell>{t(`season.${stat.season}`)}</TableCell>
                          <TableCell className="text-center font-semibold text-primary">
                            {getUsageCount(stat)}
                          </TableCell>
                          <TableCell className="text-center">
                            {stat.daysSinceLastUse !== null
                              ? isZh
                                ? `${stat.daysSinceLastUse}天前`
                                : `${stat.daysSinceLastUse} days ago`
                              : isZh
                                ? '从未使用'
                                : 'Never used'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                stat.recommendation === 'keep'
                                  ? 'bg-green-100 text-green-800'
                                  : stat.recommendation === 'low_usage'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {stat.recommendationReason}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
