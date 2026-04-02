'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppSettings, useDatabaseStats, useSystemInfo } from '@/hooks/useSettings';
import { toast } from '@/lib/toast';
import { getAllModules } from '@/modules/registry';
import { getUserActiveModules, toggleModuleSubscription } from '@/app/actions/modules';
import { Check, Globe, Grid3x3, Info, Loader2, Shield } from 'lucide-react';

import type { AppSettings, DatabaseStats, SystemInfo } from '@/lib/types/settings';

interface SettingsPageClientProps {
  initialAppSettings: AppSettings | null;
  initialDatabaseStats: DatabaseStats | null;
  initialSystemInfo: SystemInfo | null;
  initialActiveModules: string[];
}

export function SettingsPageClient({
  initialAppSettings,
  initialDatabaseStats,
  initialSystemInfo,
  initialActiveModules,
}: SettingsPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeModules, setActiveModules] = useState(initialActiveModules);
  const [loadingModules, setLoadingModules] = useState(false);

  const allModules = getAllModules();

  const { isLoading: settingsLoading } = useAppSettings({
    initialData: initialAppSettings ?? undefined,
  });
  const { data: dbStats, isLoading: dbLoading } = useDatabaseStats({
    initialData: initialDatabaseStats ?? undefined,
  });
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo({
    initialData: initialSystemInfo ?? undefined,
  });

  const refreshActiveModules = async () => {
    setLoadingModules(true);

    try {
      const modules = await getUserActiveModules();
      setActiveModules(modules);
    } catch {
      toast.error(t('common.error'), t('common.tryAgain'));
    } finally {
      setLoadingModules(false);
    }
  };

  const handleToggleModule = (moduleId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleModuleSubscription(moduleId);

        setActiveModules(previous =>
          result.subscribed ? [...previous, moduleId] : previous.filter(id => id !== moduleId)
        );

        toast.success(
          result.subscribed ? t('settings.modules.subscribed') : t('settings.modules.subscribe'),
          result.subscribed
            ? t('settings.modules.subscribedToYourList')
            : t('settings.modules.removedFromYourList')
        );

        router.refresh();
      } catch (error) {
        await refreshActiveModules();
        toast.error(
          t('common.error'),
          error instanceof Error ? error.message : t('common.tryAgain')
        );
      }
    });
  };

  if (settingsLoading || dbLoading || systemLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3x3 className="h-5 w-5" />
              <span>{t('settings.modules.title')}</span>
            </CardTitle>
            <CardDescription>{t('settings.modules.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {allModules.map(module => {
                  const isActive = activeModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`relative rounded-lg border p-4 transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{module.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isActive ? 'default' : 'outline'}
                          onClick={() => handleToggleModule(module.id)}
                          disabled={isPending}
                          className="ml-4 shrink-0"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isActive ? (
                            <>
                              <Check className="mr-1 h-4 w-4" />
                              {t('settings.modules.subscribed')}
                            </>
                          ) : (
                            t('settings.modules.subscribe')
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>{t('settings.sections.app.language')}</span>
            </CardTitle>
            <CardDescription>{t('settings.sections.app.interface')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.sections.app.language')}</Label>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <span className="text-sm text-muted-foreground">
                  {t('settings.currentLanguage', {
                    locale: locale === 'zh' ? '中文' : 'English',
                  })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('settings.languageHint')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>{t('settings.sections.security.title')}</span>
            </CardTitle>
            <CardDescription>{t('settings.sections.security.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordDialog />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>{t('settings.sections.database.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">{t('settings.sections.app.version')}</span>
                <p className="font-medium">{systemInfo?.version || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('settings.sections.database.deployment')}
                </span>
                <p className="font-medium">{systemInfo?.deployment || 'Vercel'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('settings.sections.database.status')}
                </span>
                <div className="flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      dbStats?.connected ? 'bg-green-500' : 'bg-destructive'
                    }`}
                  />
                  <span className="font-medium">
                    {dbStats?.connected
                      ? t('settings.sections.database.connected')
                      : 'Disconnected'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t('settings.sections.database.environment')}
                </span>
                <Badge
                  variant={systemInfo?.environment === 'production' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {systemInfo?.environment || 'production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
