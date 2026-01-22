'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStartUsage, useEndUsage } from '@/hooks/useQuilts';
import { useToastContext } from '@/hooks/useToast';
import { Loading } from '@/components/ui/loading';
import { Play, Square, Clock, Calendar, MapPin, FileText } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const startUsageSchema = z.object({
  usageType: z.enum(['REGULAR', 'GUEST', 'SPECIAL_OCCASION', 'SEASONAL_ROTATION']),
  location: z.string().optional(),
  expectedDuration: z.number().optional(),
  notes: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
});

const endUsageSchema = z.object({
  endDate: z.date(),
  notes: z.string().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_CLEANING', 'NEEDS_REPAIR']).optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
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
  // Map 'zh' to 'zh-CN' for date formatting if needed, though 'zh' usually works fine.
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';
  
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const toast = useToastContext();

  const startUsage = useStartUsage();
  const endUsage = useEndUsage();

  const isInUse = quilt.currentStatus === 'IN_USE' && quilt.currentUsage;

  const startForm = useForm<StartUsageInput>({
    resolver: zodResolver(startUsageSchema),
    defaultValues: {
      usageType: 'REGULAR',
      location: '',
      notes: '',
    },
  });

  const endForm = useForm<EndUsageInput>({
    resolver: zodResolver(endUsageSchema),
    defaultValues: {
      endDate: new Date(),
      condition: 'GOOD',
      satisfactionRating: 4,
    },
  });

  const USAGE_TYPES = [
    { value: 'REGULAR', label: t('usage.edit.regularUse'), description: t('usage.usageTracking.inUse') },
    { value: 'GUEST', label: t('usage.edit.guestUse'), description: t('usage.usageTracking.usedByGuests') },
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

  const CONDITION_OPTIONS = [
    { value: 'EXCELLENT', label: 'Excellent', description: 'Perfect condition, no issues' },
    { value: 'GOOD', label: 'Good', description: 'Minor wear, still in great shape' },
    { value: 'FAIR', label: 'Fair', description: 'Some wear but still usable' },
    { value: 'NEEDS_CLEANING', label: 'Needs Cleaning', description: 'Requires washing or cleaning' },
    { value: 'NEEDS_REPAIR', label: 'Needs Repair', description: 'Requires maintenance or repair' },
  ];

  const handleStartUsage = async (data: StartUsageInput) => {
    try {
      await startUsage.mutateAsync({
        quiltId: quilt.id,
        startDate: new Date(),
        ...data,
      });

      toast.success(t('usage.tracker.startedTitle'), t('usage.tracker.startedMessage', { name: quilt.name }));
      setShowStartDialog(false);
      startForm.reset();
      onUsageChange?.();
    } catch (error) {
      toast.error(
        t('usage.tracker.failedStart'),
        error instanceof Error ? error.message : t('usage.actions.pleaseTryAgain')
      );
    }
  };

  const handleEndUsage = async (data: EndUsageInput) => {
    if (!quilt.currentUsage) return;

    try {
      await endUsage.mutateAsync({
        quiltId: quilt.id,
        ...data,
      });

      toast.success(t('usage.tracker.endedTitle'), t('usage.tracker.endedMessage', { name: quilt.name }));
      setShowEndDialog(false);
      endForm.reset();
      onUsageChange?.();
    } catch (error) {
      toast.error(
        t('usage.tracker.failedEnd'),
        error instanceof Error ? error.message : t('usage.actions.pleaseTryAgain')
      );
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
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
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
          // Currently in use - show usage details and end button
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">{t('usage.tracker.currentlyInUse')}</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  {quilt.currentUsage.usageType.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t('dashboardSpecific.startedUsing')}:{' '}
                    {new Date(quilt.currentUsage.startedAt).toLocaleDateString(dateLocale)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>{t('usage.labels.duration')}: {getUsageDuration()}</span>
                </div>
                {quilt.currentUsage.location && (
                  <div className="flex items-center space-x-2 text-blue-700">
                    <MapPin className="w-4 h-4" />
                    <span>{t('usage.tracker.usageLocation')}: {quilt.currentUsage.location}</span>
                  </div>
                )}
                {quilt.currentUsage.notes && (
                  <div className="md:col-span-2 flex items-start space-x-2 text-blue-700">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <span>{t('usage.labels.notes')}: {quilt.currentUsage.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Square className="w-4 h-4 mr-2" />
                  {t('usage.tracker.endTracking')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('usage.tracker.endTracking')}</DialogTitle>
                  <DialogDescription>
                   {t('usage.tracker.endDescription')}
                  </DialogDescription>
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
                              onChange={e =>
                                field.onChange(
                                  e.target.value ? new Date(e.target.value) : new Date()
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
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.condition')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('ui.selectCondition')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONDITION_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {option.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('usage.tracker.conditionDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={endForm.control}
                      name="satisfactionRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.satisfaction')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('usage.tracker.satisfactionDescription')}
                          </FormDescription>
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
                          <FormDescription>
                            {t('usage.tracker.notesDescription')}
                          </FormDescription>
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
                      <Button type="submit" disabled={endUsage.isPending}>
                        {endUsage.isPending && <Loading size="sm" className="mr-2" />}
                        {t('usage.tracker.endTracking')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          // Not in use - show start usage button
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              {t('usage.tracker.notTracked')}
            </p>

            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  {t('usage.tracker.startTracking')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('usage.tracker.startTracking')}</DialogTitle>
                  <DialogDescription>
                    {t('dashboardSpecific.beginTrackingUsage')}
                  </DialogDescription>
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
                              {USAGE_TYPES.map(type => (
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
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.usageLocation')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('usage.tracker.locationPlaceholder')} {...field} />
                          </FormControl>
                          <FormDescription>
                            {t('usage.tracker.locationDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={startForm.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('usage.tracker.temperature')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t('usage.tracker.tempPlaceholder')}
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>{t('usage.tracker.tempDescription')}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={startForm.control}
                        name="humidity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('usage.tracker.humidity')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t('usage.tracker.humidityPlaceholder')}
                                min="0"
                                max="100"
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>{t('usage.tracker.humidityDescription')}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={startForm.control}
                      name="expectedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('usage.tracker.expectedDuration')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t('usage.tracker.durationPlaceholder')}
                              {...field}
                              onChange={e =>
                                field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {t('usage.tracker.durationDescription')}
                          </FormDescription>
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
                      <Button type="submit" disabled={startUsage.isPending}>
                        {startUsage.isPending && <Loading size="sm" className="mr-2" />}
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
