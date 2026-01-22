'use client';

import { useTranslations, useLocale } from 'next-intl';
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
import { Edit, PackageOpen } from 'lucide-react';
import { EditUsageRecordDialog } from './EditUsageRecordDialog';
import { TemperatureDisplay } from './TemperatureDisplay';
import { EmptyState } from '@/components/ui/empty-state';

interface UsageRecord {
  id: string;
  quiltId?: string;
  startDate: Date;
  endDate?: Date | null;
  notes?: string | null;
  usageType?: string;
  startedAt?: string;
  endedAt?: string;
}

interface UsageHistoryTableProps {
  usageRecords: UsageRecord[];
  isLoading: boolean;
  quiltName: string;
  quiltId?: string;
  itemNumber?: number;
}

export function UsageHistoryTable({
  usageRecords,
  isLoading,
  quiltName,
  quiltId,
  itemNumber,
}: UsageHistoryTableProps) {
  const t = useTranslations();
  const locale = useLocale();

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };



  // Improved duration formatting to handle pluralization properly via translations if possible, 
  // but for now keeping it simple or using the existing helper with keys.
  // Actually, I have "duration": "{days} day | {days} days" in usage.timeline.
  // I can use t('usage.timeline.duration', {days: days}) which handles pluralization if configured.
  // usage.timeline.duration is "{days} day | {days} days" (ICU syntax).
  
  const formatDurationICU = (startDate: Date, endDate?: Date | null) => {
      if (!endDate) return '-';
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        // ICU message: "{days} day | {days} days" works with pluralization? 
        // Or "duration": "{days, plural, =0 {<1 day} one {# day} other {# days}}"
        // My JSON has: "duration": "{days} day | {days} days" which might be simple pipe or just incorrect.
        // Let's use manual logic for now to be safe as I didn't verify ICU setup.
        if (days === 0) return t('usage.history.lessThanOneDay');
        return startDate ? `${days} ${locale === 'zh' ? '天' : (days === 1 ? 'day' : 'days')}` : '-'; 
      } catch {
        return '-';
      }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>;
  }

  if (usageRecords.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={t('usage.calendar.noHistory')}
        description={
            locale === 'zh' ? '这个被子还没有使用记录' : 'This quilt has no usage records yet'
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.history.started')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.history.startTemp')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.history.ended')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.history.endTemp')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.history.duration')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('usage.timeline.notes')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('quilts.table.status')}
              </TableHead>
              <TableHead className="h-12 text-center font-medium text-muted-foreground">
                {t('quilts.views.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageRecords.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell className="text-center font-medium">
                  {usageRecords.length - index}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDate(record.startDate)}
                </TableCell>
                <TableCell className="text-center">
                  <TemperatureDisplay date={record.startDate} compact />
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {record.endDate ? formatDate(record.endDate) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {record.endDate ? <TemperatureDisplay date={record.endDate} compact /> : '-'}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDurationICU(record.startDate, record.endDate)}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {record.notes || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={!record.endDate ? 'default' : 'secondary'}>
                    {!record.endDate
                      ? t('usage.labels.active')
                      : t('usage.history.completed')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <EditUsageRecordDialog
                    record={{
                      id: record.id,
                      quiltId: quiltId || record.quiltId || '',
                      startedAt: record.startDate?.toString() || record.startedAt || '',
                      endedAt: record.endDate?.toString() || record.endedAt || null,
                      usageType: record.usageType || 'REGULAR',
                      notes: record.notes || null,
                      quiltName: quiltName,
                      itemNumber: itemNumber || 0,
                      color: '',
                      isActive: !record.endDate,
                    }}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
