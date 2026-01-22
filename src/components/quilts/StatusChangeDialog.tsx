'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Info } from 'lucide-react';
import { useActiveUsageRecord } from '@/hooks/useUsage';

import { Quilt } from '@/types/quilt';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quilt?: Quilt | null;
  onStatusChange: (
    quiltId: string,
    newStatus: string,
    options?: { startDate?: string; endDate?: string; notes?: string }
  ) => Promise<void>;
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  quilt,
  onStatusChange,
}: StatusChangeDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(quilt?.currentStatus || 'STORAGE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Get active usage record if quilt is currently in use
  const { data: activeUsageData } = useActiveUsageRecord(quilt?.id || '');
  const activeUsage = (activeUsageData as { json?: { startDate?: string } })?.json || activeUsageData; // Safer typing

  // Reset form when dialog opens or quilt changes
  useEffect(() => {
    if (open && quilt) {
      setNewStatus(quilt.currentStatus || 'STORAGE');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [open, quilt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quilt) return;

    setLoading(true);
    try {
      const options: { startDate?: string; endDate?: string; notes?: string } = {};

      // If changing TO IN_USE, include start date
      if (newStatus === 'IN_USE' && quilt.currentStatus !== 'IN_USE') {
        options.startDate = startDate;
        if (notes) options.notes = notes;
      }

      // If changing FROM IN_USE, include end date
      if (quilt.currentStatus === 'IN_USE' && newStatus !== 'IN_USE') {
        options.endDate = endDate;
        if (notes) options.notes = notes;
      }

      await onStatusChange(quilt.id, newStatus, options);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('quilts.dialogs.statusUpdateFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if we're changing to or from IN_USE
  const isChangingToInUse = newStatus === 'IN_USE' && quilt?.currentStatus !== 'IN_USE';
  const isChangingFromInUse = quilt?.currentStatus === 'IN_USE' && newStatus !== 'IN_USE';
  const isCurrentlyInUse = quilt?.currentStatus === 'IN_USE';
  const showDateFields = isChangingToInUse || isChangingFromInUse;

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'IN_USE':
        return 'text-green-600';
      case 'STORAGE':
        return 'text-orange-600';
      case 'MAINTENANCE':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quilts.dialogs.changeStatus')}</DialogTitle>
          <DialogDescription>
            {t('quilts.dialogs.changeStatusDesc', { name: quilt ? quilt.name : '' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('quilts.dialogs.currentStatus')}</Label>
            <div className={`text-sm font-medium ${getStatusColor(quilt?.currentStatus)}`}>
              {quilt?.currentStatus ? t(`status.${quilt.currentStatus}`) : ''}
            </div>
          </div>

          {/* Show current usage start date if quilt is in use */}
          {isCurrentlyInUse && activeUsage && activeUsage.startDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                <Info className="w-4 h-4" />
                <span>{t('usage.labels.currentUsageInfo')}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">{t('usage.labels.started')}</Label>
                <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                  {new Date(activeUsage.startDate).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newStatus">{t('quilts.dialogs.newStatus')}</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Quilt['currentStatus'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_USE">
                  <span className="text-green-600">{t('status.IN_USE')}</span>
                </SelectItem>
                <SelectItem value="STORAGE">
                  <span className="text-orange-600">{t('status.STORAGE')}</span>
                </SelectItem>
                <SelectItem value="MAINTENANCE">
                  <span className="text-yellow-600">{t('status.MAINTENANCE')}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show date field when changing to IN_USE */}
          {isChangingToInUse && (
            <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-800 mb-2">
                <Info className="w-4 h-4" />
                <span>{t('usage.labels.startingUsageTracking')}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('usage.labels.started')}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* Show date field when changing from IN_USE */}
          {isChangingFromInUse && (
            <div className="space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-orange-800 mb-2">
                <Info className="w-4 h-4" />
                <span>{t('usage.labels.endingUsageTracking')}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('usage.labels.ended')}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* Notes field - show when changing to/from IN_USE */}
          {showDateFields && (
            <div className="space-y-2">
              <Label htmlFor="notes">{t('usage.labels.notesOptional')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('usage.labels.notesPlaceholder')}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading || newStatus === quilt?.currentStatus}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
