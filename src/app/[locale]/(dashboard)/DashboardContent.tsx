'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboardStats } from '@/hooks/useDashboard';
import { useLanguage } from '@/lib/language-provider';
import { DashboardStatsSkeleton, CardSkeleton } from '@/components/ui/skeleton-layouts';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Package, Activity, Archive, History, PackageOpen } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { AnimatedList, AnimatedListItem } from '@/components/motion/AnimatedList';
import { EmptyState } from '@/components/ui/empty-state';
import { WeatherForecastWidget } from '@/components/weather/WeatherForecast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardContent() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useDashboardStats();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <DashboardStatsSkeleton cards={3} />
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton className="h-80" />
          <CardSkeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorAlert title={t('common.error')} message={error.message} />
      </div>
    );
  }

  const overview = stats?.overview || {
    totalQuilts: 0,
    inUseCount: 0,
    storageCount: 0,
    maintenanceCount: 0,
  };

  const inUseQuilts = stats?.inUseQuilts || [];
  const historicalUsage = stats?.historicalUsage || [];
  const lang = t('language') === 'zh' ? 'zh' : 'en';

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Weather Forecast at Top */}
        <WeatherForecastWidget />

        {/* Enhanced Stats Grid - 3 Cards */}
        <AnimatedList className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Quilts Card */}
          <AnimatedListItem>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.totalQuilts')}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{overview.totalQuilts}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'zh' ? '总收藏' : 'Total Collection'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>

          {/* In Use Card */}
          <AnimatedListItem>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.inUse')}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 mt-2">{overview.inUseCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'zh' ? '使用中' : 'Currently Active'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>

          {/* Storage Card */}
          <AnimatedListItem>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Archive className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('dashboard.stats.storage')}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {overview.storageCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'zh' ? '已存储' : 'In Storage'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Archive className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>
        </AnimatedList>

        {/* Tabbed Content Section */}
        <Card>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>{t('dashboard.tabs.currentUse')}</span>
                {inUseQuilts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {inUseQuilts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>{t('dashboard.tabs.historicalUse')}</span>
                {historicalUsage.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {historicalUsage.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-0">
              <CardContent className="divide-y divide-border p-0">
                {inUseQuilts.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={PackageOpen}
                      title={t('pages.noQuiltsInUse')}
                      description={
                        lang === 'zh' ? '当前没有正在使用的被子' : 'No quilts are currently in use'
                      }
                    />
                  </div>
                ) : (
                  inUseQuilts.map((quilt: any) => (
                    <div
                      key={quilt.id}
                      className="px-6 py-3 table-row-hover cursor-pointer"
                      role="row"
                      tabIndex={0}
                      onDoubleClick={() => router.push(`/quilts?search=${quilt.name}`)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/quilts?search=${quilt.name}`);
                        }
                      }}
                      aria-label={`${quilt.name}, ${t(`season.${quilt.season}`)}, ${quilt.fillMaterial}, ${quilt.weightGrams}g, ${quilt.location}. ${lang === 'zh' ? '按回车键查看详情' : 'Press Enter to view details'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Package className="w-5 h-5 text-success flex-shrink-0" />
                          <span className="font-medium text-foreground">{quilt.name}</span>
                          <span className="text-sm text-muted-foreground">#{quilt.itemNumber}</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              quilt.season === 'WINTER'
                                ? 'bg-info/10 text-info'
                                : quilt.season === 'SUMMER'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                            }`}
                          >
                            {t(`season.${quilt.season}`)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {quilt.fillMaterial} · {quilt.weightGrams}g · {quilt.location}
                          </span>
                        </div>
                        <Link
                          href={`/quilts?search=${quilt.name}`}
                          prefetch={false}
                          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {t('pages.viewDetails')}
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <CardContent className="divide-y divide-border p-0">
                {historicalUsage.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      icon={History}
                      title={t('pages.noHistoricalRecords')}
                      description={
                        lang === 'zh'
                          ? '这一天在往年没有使用记录'
                          : 'No historical records for this date'
                      }
                    />
                  </div>
                ) : (
                  historicalUsage.map((record: any) => (
                    <div
                      key={record.id}
                      className="px-6 py-3 table-row-hover cursor-pointer"
                      role="row"
                      tabIndex={0}
                      onDoubleClick={() => router.push(`/quilts?search=${record.quiltName}`)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/quilts?search=${record.quiltName}`);
                        }
                      }}
                      aria-label={`${record.year}, ${record.quiltName}, ${t(`season.${record.season}`)}. ${lang === 'zh' ? '按回车键查看详情' : 'Press Enter to view details'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-accent-foreground w-12 text-center">
                          {record.year}
                        </span>
                        <span className="font-medium text-foreground">{record.quiltName}</span>
                        <span className="text-sm text-muted-foreground">#{record.itemNumber}</span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            record.season === 'WINTER'
                              ? 'bg-info/10 text-info'
                              : record.season === 'SUMMER'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-success/10 text-success'
                          }`}
                        >
                          {t(`season.${record.season}`)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.startDate).toLocaleDateString(
                            lang === 'zh' ? 'zh-CN' : 'en-US',
                            { month: 'short', day: 'numeric' }
                          )}
                          {record.endDate && (
                            <>
                              {' → '}
                              {new Date(record.endDate).toLocaleDateString(
                                lang === 'zh' ? 'zh-CN' : 'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </PageTransition>
  );
}
