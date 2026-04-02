'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, FileText, MapPin, Play, Square } from 'lucide-react';

import { changeQuiltStatusAction } from '@/app/actions/quilts';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToastContext } from '@/hooks/useToast';

const startUsageSchema = z.object({
  usageType: z.enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION']),
  notes: z.string().optional(),
});

const endUsageSchema = z.object({
  endDate: z.date(),
  notes: z.string().optional(),
});

type StartUsageInput = z.infer<typeof startUsageSchema>;
type EndUsageInput = z.infer<typeof endUsageSchema>;

interface UsageTrackerProps {
  quilt: {
    id: string;
    name: string;
    itemNumber: number;
    currentStatus: string;
    currentUsage?: {
      id: string;
      startedAt: Date;
      usageType: string;
      location?: string | null;
      notes?: string | null;
    } | null;
  };
  onUsageChange?: () => void;
}

export function UsageTracker({ quilt, onUsageChange }: UsageTrackerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToastContext();

  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isStartingUsage, setIsStartingUsage] = useState(false);
  const [isEndingUsage, setIsEndingUsage] = useState(false);

  const isInUse = quilt.currentStatus === 'IN_USE' && quilt.currentUsage;

  const startForm = useForm<StartUsageInput>({
    resolver: zodResolver(startUsageSchema),
    defaultValues: {
      usageType: 'REGULAR',
      notes: '',
    },
  });

  const endForm = useForm<EndUsageInput>({
    resolver: zodResolver(endUsageSchema),
    defaultValues: {
      endDate: new Date(),
      notes: '',
    },
  });

  const usageTypes = [
    {
      value: 'REGULAR',
      label: t('usage.edit.regularUse'),
      description: t('usage.usageTracking.inUse'),
    },
    {
      value: 'GUEST',
      label: t('usage.edit.guestUse'),
      description: t('usage.usageTracking.usedByGuests'),
    },
    {
      value: 'SPECIAL_OCCASION',
      label: t('usage.edit.specialOccasion'),
      description: t('usage.usageTracking.specialEvents'),
    },
    {
      value: 'SEASONAL_ROTATION',
      label: t('usage.edit.seasonalRotation'),
      description: t('usage.usageTracking.seasonalRotation'),
    },
  ];

  const refreshUsageViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['quilts'] }),
      queryClient.invalidateQueries({ queryKey: ['usage'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
    router.refresh();
    onUsageChange?.();
  };

  const handleStartUsage = async (data: StartUsageInput) => {
    try {
      setIsStartingUsage(true);

      const result = await changeQuiltStatusAction({
        quiltId: quilt.id,
        status: 'IN_USE',
        usageType: data.usageType,
        notes: data.notes,
        startDate: new Date(),
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await refreshUsageViews();
      toast.success(
        t('usage.tracker.startedTitle'),
        t('usage.tracker.startedMessage', { name: quilt.name })
      );
      setShowStartDialog(false);
      startForm.reset({
        usageType: 'REGULAR',
        notes: '',
      });
    } catch (error) {
      toast.error(
        t('usage.tracker.failedStart'),
        error instanceof Error ? error.message : t('usage.actions.pleaseTryAgain')
      );
    } finally {
      setIsStartingUsage(false);
    }
  };

  const handleEndUsage = async (data: EndUsageInput) => {
    if (!quilt.currentUsage) return;

    try {
      setIsEndingUsage(true);

      const result = await changeQuiltStatusAction({
        quiltId: quilt.id,
        status: 'STORAGE',
        notes: data.notes,
        endDate: data.endDate,
      });

      if (!result.success) {
        throw new Error(result.error.message);
      }

      await refreshUsageViews();
      toast.success(
        t('usage.tracker.endedTitle'),
        t('usage.tracker.endedMessage', { name: quilt.name })
      );
      setShowEndDialog(false);
      endForm.reset({
        endDate: new Date(),
        notes: '',
      });
    } catch (error) {
      toast.error(
        t('usage.tracker.failedEnd'),
        error instanceof Error ? error.message : t('usage.actions.pleaseTryAgain')
      );
    } finally {
      setIsEndingUsage(false);
    }
  };

  const getUsageDuration = () => {
    if (!quilt.currentUsage) return null;

    const start = new Date(quilt.currentUsage.startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (locale === 'zh') {
      if (diffDays > 0) return `${diffDays}天 ${diffHours}小时`;
      return `${diffHours}小时`;
    }

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }

    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>{t('usage.title')}</span>
          </div>
          <Badge variant={isInUse ? 'default' : 'secondary'}>
            {isInUse ? t('usage.status.active') : t('dashboard.stats.storage')}
          </Badge>
        </CardTitle>
        <CardDescription>{t('usage.subtitle')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isInUse && quilt.currentUsage ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-blue-900">{t('usage.tracker.currentlyInUse')}</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  {quilt.currentUsage.usageType.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t('dashboardSpecific.startedUsing')}:{' '}
                    {new Date(quilt.currentUsage.startedAt).toLocaleDateString(dateLocale)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span>
                    {t('usage.labels.duration')}: {getUsageDuration()}
                  </span>
                </div>
                {quilt.currentUsage.location && (
                  <div className="flex items-center space-x-2 text-blue-700">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {t('usage.tracker.usageLocation')}: {quilt.currentUsage.location}
                    </span>
                  </div>
                )}
                {quilt.currentUsage.notes && (
                  <div className="flex items-start space-x-2 text-blue-700 md:col-span-2">
                    <FileText className="mt-0.5 h-4 w-4" />
                    <span>
                      {t('usage.labels.notes')}: {quilt.currentUsage.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Square className="mr-2 h-4 w-4" />
                  {t('usage.tracker.endTracking')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('usage.tracker.endTracking')}</DialogTitle>
                  <DialogDescription>{t('usage.tracker.endDescription')}</DialogDescription>
                </DialogHeader>

                <Form {...endForm}>
                  <form onSubmit={endForm.handleSubmit(handleEndUsage)} className="space-y-4">
                    <FormField
                      control={endForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.endDate')}</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={
                                field.value
                                  ? new Date(
                                      field.value.getTime() -
                                        field.value.getTimezoneOffset() * 60000
                                    )
                                      .toISOString()
                                      .slice(0, 16)
                                  : ''
                              }
                              onChange={event =>
                                field.onChange(
                                  event.target.value ? new Date(event.target.value) : new Date()
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>{t('usage.tracker.endDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={endForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.labels.notes')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('usage.tracker.notesPlaceholder')}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>{t('usage.tracker.notesDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEndDialog(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={isEndingUsage}>
                        {isEndingUsage && <Loading size="sm" className="mr-2" />}
                        {t('usage.tracker.endTracking')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="mb-4 text-muted-foreground">{t('usage.tracker.notTracked')}</p>

            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  {t('usage.tracker.startTracking')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('usage.tracker.startTracking')}</DialogTitle>
                  <DialogDescription>{t('dashboardSpecific.beginTrackingUsage')}</DialogDescription>
                </DialogHeader>

                <Form {...startForm}>
                  <form onSubmit={startForm.handleSubmit(handleStartUsage)} className="space-y-4">
                    <FormField
                      control={startForm.control}
                      name="usageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.edit.usageType')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('ui.selectUsageType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {usageTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {type.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>{t('usage.edit.selectUsageType')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={startForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.initialNotes')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('usage.tracker.startNotesPlaceholder')}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('usage.tracker.startNotesDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowStartDialog(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={isStartingUsage}>
                        {isStartingUsage && <Loading size="sm" className="mr-2" />}
                        {t('usage.actions.startUsing')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
