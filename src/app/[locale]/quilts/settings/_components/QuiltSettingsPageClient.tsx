'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSettings, useUpdateAppSettings } from '@/hooks/useSettings';
import { toast } from '@/lib/toast';
import { MousePointerClick, Settings, ShieldAlert } from 'lucide-react';

import type { AppSettings } from '@/lib/types/settings';

interface QuiltSettingsPageClientProps {
  initialAppSettings: AppSettings | null;
  isAdmin: boolean;
}

export function QuiltSettingsPageClient({
  initialAppSettings,
  isAdmin,
}: QuiltSettingsPageClientProps) {
  const t = useTranslations('quilts.settingsPage');
  const tRoot = useTranslations();
  const { data: appSettings, isLoading } = useAppSettings({
    initialData: initialAppSettings ?? undefined,
  });
  const updateSettings = useUpdateAppSettings();

  const doubleClickAction = appSettings?.doubleClickAction || 'status';
  const usageDoubleClickAction = appSettings?.usageDoubleClickAction || 'view';

  const handleSave = async (
    values: Partial<Pick<AppSettings, 'doubleClickAction' | 'usageDoubleClickAction'>>,
    successMessage: string
  ) => {
    try {
      await updateSettings.mutateAsync(values);
      toast.success(tRoot('settings.actions.saved'), successMessage);
    } catch (error) {
      toast.error(
        tRoot('actions.failedToSave'),
        error instanceof Error ? error.message : tRoot('actions.pleaseTryAgain')
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-6 w-6" />
                {t('accessDeniedTitle')}
              </CardTitle>
              <CardDescription>{t('accessDeniedDescription')}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <Settings className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MousePointerClick className="h-5 w-5" />
              <span>{t('sections.interaction.title')}</span>
            </CardTitle>
            <CardDescription>{t('sections.interaction.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="double-click-action">{t('fields.quiltDoubleClick.label')}</Label>
              <Select
                value={doubleClickAction}
                onValueChange={value =>
                  handleSave(
                    { doubleClickAction: value as AppSettings['doubleClickAction'] },
                    t('toasts.quiltDoubleClickUpdated')
                  )
                }
              >
                <SelectTrigger id="double-click-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('options.none')}</SelectItem>
                  <SelectItem value="view">{t('options.view')}</SelectItem>
                  <SelectItem value="status">{t('options.status')}</SelectItem>
                  <SelectItem value="edit">{t('options.editQuilt')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('fields.quiltDoubleClick.help')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage-double-click-action">
                {t('fields.usageDoubleClick.label')}
              </Label>
              <Select
                value={usageDoubleClickAction}
                onValueChange={value =>
                  handleSave(
                    { usageDoubleClickAction: value as AppSettings['usageDoubleClickAction'] },
                    t('toasts.usageDoubleClickUpdated')
                  )
                }
              >
                <SelectTrigger id="usage-double-click-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('options.none')}</SelectItem>
                  <SelectItem value="view">{t('options.view')}</SelectItem>
                  <SelectItem value="edit">{t('options.editRecord')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('fields.usageDoubleClick.help')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
