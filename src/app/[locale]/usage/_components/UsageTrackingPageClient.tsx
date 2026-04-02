'use client';

import { useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditUsageRecordDialog } from '@/components/usage/EditUsageRecordDialog';
import { useAppSettings } from '@/hooks/useSettings';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Clock,
  Edit,
  Eye,
  Package,
  PackageOpen,
} from 'lucide-react';

interface UsageTrackingStats {
  total: number;
  active: number;
  completed: number;
}

interface UsageHistoryRecord {
  id: string;
  quiltId: string;
  quiltName: string;
  itemNumber: number;
  color: string;
  startedAt: string;
  endedAt: string | null;
  usageType: string | null;
  notes: string | null;
  isActive: boolean;
  duration: number | null;
}

interface UsageTrackingPageClientProps {
  initialUsageHistory: UsageHistoryRecord[];
  initialStats: UsageTrackingStats;
}

export function UsageTrackingPageClient({
  initialUsageHistory,
  initialStats,
}: UsageTrackingPageClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { data: appSettings } = useAppSettings();

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const isZh = locale === 'zh';

  const handleRecordClick = (record: UsageHistoryRecord) => {
    router.push(`/usage/${record.quiltId}?from=usage`);
  };

  const handleRecordDoubleClick = (record: UsageHistoryRecord) => {
    const usageDoubleClickAction = (appSettings?.usageDoubleClickAction as string) || 'view';

    switch (usageDoubleClickAction) {
      case 'view':
        handleRecordClick(record);
        break;
      case 'edit': {
        const editButton = document.querySelector(
          `[data-record-id="${record.id}"] button[data-action="edit"]`
        ) as HTMLButtonElement | null;

        editButton?.click();
        break;
      }
      case 'none':
      default:
        break;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Invalid Date';

      return date.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', {
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
    if (days === 0) return isZh ? '不到1天' : '<1 day';
    return isZh ? `${days}天` : `${days} days`;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }

    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const sortedUsageHistory = useMemo(() => {
    const records = [...initialUsageHistory];

    if (!sortField) {
      return records;
    }

    return records.sort((a, b) => {
      let aValue: string | number | boolean | null = a[sortField as keyof UsageHistoryRecord] as
        | string
        | number
        | boolean
        | null;
      let bValue: string | number | boolean | null = b[sortField as keyof UsageHistoryRecord] as
        | string
        | number
        | boolean
        | null;

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (sortField === 'startedAt' || sortField === 'endedAt') {
        aValue = new Date(String(aValue)).getTime();
        bValue = new Date(String(bValue)).getTime();
      }

      if (sortField === 'isActive') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [initialUsageHistory, sortDirection, sortField]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{initialStats.total}</p>
                <p className="text-xs text-muted-foreground">{t('usage.stats.totalRecords')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{initialStats.active}</p>
                <p className="text-xs text-muted-foreground">{t('usage.status.active')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{initialStats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('usage.status.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => handleSort('itemNumber')}
                >
                  <div className="flex items-center justify-center">
                    {t('quilts.table.itemNumber')}
                    {renderSortIcon('itemNumber')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => handleSort('quiltName')}
                >
                  <div className="flex items-center justify-center">
                    {t('quilts.views.name')}
                    {renderSortIcon('quiltName')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => handleSort('startedAt')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.started')}
                    {renderSortIcon('startedAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => handleSort('endedAt')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.ended')}
                    {renderSortIcon('endedAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center justify-center">
                    {t('usage.labels.duration')}
                    {renderSortIcon('duration')}
                  </div>
                </TableHead>
                <TableHead
                  className="h-12 cursor-pointer select-none text-center font-medium text-muted-foreground transition-colors hover:bg-muted/80"
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
                sortedUsageHistory.map(record => (
                  <TableRow
                    key={record.id}
                    data-record-id={record.id}
                    onDoubleClick={() => handleRecordDoubleClick(record)}
                    className="cursor-pointer hover:bg-muted/50"
                    title={isZh ? '双击执行操作' : 'Double-click to perform action'}
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
                          title={isZh ? '查看详情' : 'View Details'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <EditUsageRecordDialog
                          record={{
                            id: record.id,
                            quiltId: record.quiltId,
                            startedAt: record.startedAt,
                            endedAt: record.endedAt,
                            usageType: record.usageType || 'REGULAR',
                            notes: record.notes,
                            quiltName: record.quiltName,
                            itemNumber: record.itemNumber,
                            color: record.color,
                            isActive: record.isActive,
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" data-action="edit">
                              <Edit className="h-4 w-4" />
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
