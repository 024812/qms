'use client';

import { Suspense, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton-layouts';
import {
  Clock,
  Package,
  BarChart3,
  Eye,
  PackageOpen,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { EditUsageRecordDialog } from '@/components/usage/EditUsageRecordDialog';
import { useUsageRecords, useOverallUsageStats } from '@/hooks/useUsage';
import { useAppSettings } from '@/hooks/useSettings';

function UsageTrackingContent() {
  const router = useRouter();
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const t = useTranslations();
  const locale = useLocale();
  const language = locale; // Adapter variable

  // Use React Query hooks
  const { data: usageData, isLoading: loading } = useUsageRecords();
  const { data: statsData } = useOverallUsageStats();
  const { data: appSettings } = useAppSettings();

  // Extract data with superjson wrapper handling
  const usageHistory = (usageData as any)?.json || usageData || [];
  const stats = (statsData as any)?.json || statsData || { total: 0, active: 0, completed: 0 };

  const handleRecordClick = (record: any) => {
    // Navigate to detail page
    router.push(`/usage/${record.quiltId}?from=usage`);
  };

  const handleRecordDoubleClick = (record: any) => {
    const usageDoubleClickAction = (appSettings?.usageDoubleClickAction as string) || 'view';

    switch (usageDoubleClickAction) {
      case 'view':
        // View quilt details
        handleRecordClick(record);
        break;
      case 'edit':
        // Find and click the edit button for this record
        const editButton = document.querySelector(
          `[data-record-id="${record.id}"] button[data-action="edit"]`
        ) as HTMLButtonElement;
        if (editButton) {
          editButton.click();
        }
        break;
      case 'none':
      default:
        // Do nothing
        break;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDuration = (days: number | null | undefined) => {
    if (days === null || days === undefined) return '-';
    if (days === 0) return language === 'zh' ? '不到1天' : '<1 day';
    return language === 'zh' ? `${days}天` : `${days} days`;
  };

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  // Sort usage history
  const sortedUsageHistory = [...usageHistory].sort((a: any, b: any) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle null/undefined
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Special handling for dates
    if (sortField === 'startedAt' || sortField === 'endedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Special handling for duration
    if (sortField === 'duration') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Compare
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Table Skeleton */}
        <div className="rounded-md border p-4">
          <TableSkeleton rows={6} columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('usage.stats.totalRecords')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t('usage.status.active')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('usage.status.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage History Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('itemNumber')}
                >
                  <div className="flex items-center justify-center">
                    {t('quilts.table.itemNumber')}
                    {renderSortIcon('itemNumber')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('quiltName')}
                >
                  <div className="flex items-center justify-center">
                    {t('quilts.views.name')}
                    {renderSortIcon('quiltName')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('startedAt')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.started')}
                    {renderSortIcon('startedAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('endedAt')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.ended')}
                    {renderSortIcon('endedAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.duration')}
                    {renderSortIcon('duration')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 text-center font-medium text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => handleSort('isActive')}
                >
                  <div className="flex items-center justify-center">
                    {t('quilts.table.status')}
                    {renderSortIcon('isActive')}
                  </div>
                </TableHead>
                <TableHead className="h-12 text-center font-medium text-muted-foreground">
                  {t('quilts.views.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsageHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24">
                    <EmptyState
                      icon={PackageOpen}
                      title={t('usage.empty.title')}
                      description={t('usage.empty.description')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsageHistory.map((record: any) => (
                  <TableRow
                    key={record.id}
                    data-record-id={record.id}
                    onDoubleClick={() => handleRecordDoubleClick(record)}
                    className="cursor-pointer hover:bg-muted/50"
                    title={language === 'zh' ? '双击执行操作' : 'Double-click to perform action'}
                  >
                    <TableCell className="text-center font-medium">#{record.itemNumber}</TableCell>
                    <TableCell className="text-center font-medium">{record.quiltName}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDate(record.startedAt)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {record.endedAt ? formatDate(record.endedAt) : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {formatDuration(record.duration)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={record.isActive ? 'default' : 'secondary'}>
                        {record.isActive ? t('usage.status.active') : t('usage.status.completed')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRecordClick(record)}
                          title={language === 'zh' ? '查看详情' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <EditUsageRecordDialog
                          record={{
                            id: record.id,
                            quiltId: record.quiltId,
                            startedAt: record.startedAt,
                            endedAt: record.endedAt,
                            usageType: record.usageType,
                            notes: record.notes,
                            quiltName: record.quiltName,
                            itemNumber: record.itemNumber,
                            color: record.color,
                            isActive: record.isActive,
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" data-action="edit">
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function UsageTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <TableSkeleton rows={8} columns={7} />
        </div>
      }
    >
      <UsageTrackingContent />
    </Suspense>
  );
}
