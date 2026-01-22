'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Shield, Globe, Grid3x3, Check, Loader2, Info } from 'lucide-react';
import { toast } from '@/lib/toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import {
  useAppSettings,
  useDatabaseStats,
  useSystemInfo,
} from '@/hooks/useSettings';
import { getAllModules } from '@/modules/registry';
import { useEffect, useState, useTransition } from 'react';
import { getUserActiveModules, toggleModuleSubscription } from '@/app/actions/modules';

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  // const language = locale; // No longer needed
  const [isPending, startTransition] = useTransition();

  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const allModules = getAllModules();

  // Fetch data
  const { isLoading: settingsLoading } = useAppSettings();
  const { data: dbStats, isLoading: dbLoading } = useDatabaseStats();
  const { data: systemInfo, isLoading: systemLoading } = useSystemInfo();

  // Fetch active modules
  useEffect(() => {
    async function fetchModules() {
      try {
        const modules = await getUserActiveModules();
        setActiveModules(modules);
      } catch (error) {
        console.error('Failed to fetch modules:', error);
      } finally {
        setLoadingModules(false);
      }
    }
    fetchModules();
  }, []);

  const handleToggleModule = async (moduleId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleModuleSubscription(moduleId);
        if (result.subscribed) {
          setActiveModules(prev => [...prev, moduleId]);
          toast.success(
            t('settings.modules.subscribed'),
            t('settings.modules.subscribedToYourList')
          );
        } else {
          setActiveModules(prev => prev.filter(id => id !== moduleId));
          toast.success(
            t('settings.modules.subscribe'),
            t('settings.modules.removedFromYourList')
          );
        }
        // Reload to update sidebar
        window.location.reload();
      } catch (error) {
        toast.error(
          t('common.error'),
          error instanceof Error ? error.message : t('common.error')
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
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Module Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3x3 className="w-5 h-5" />
              <span>{t('settings.modules.title')}</span>
            </CardTitle>
            <CardDescription>
              {t('settings.modules.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allModules.map(module => {
                  const isActive = activeModules.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      className={`relative p-4 border rounded-lg transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{module.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isActive ? 'default' : 'outline'}
                          onClick={() => handleToggleModule(module.id)}
                          disabled={isPending}
                          className="shrink-0 ml-4"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isActive ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
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

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>{t('settings.sections.app.language')}</span>
            </CardTitle>
            <CardDescription>
              {t('settings.sections.app.interface')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">
                {t('settings.sections.app.language')}
              </Label>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <span className="text-sm text-muted-foreground">
                  {t('settings.currentLanguage', { locale: locale === 'zh' ? '中文' : 'English' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.languageHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>{t('settings.sections.security.title')}</span>
            </CardTitle>
            <CardDescription>
              {t('settings.sections.security.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordDialog />
          </CardContent>
        </Card>

        {/* System Info - Compact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>{t('settings.sections.database.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('settings.sections.app.version')}</span>
                <p className="font-medium">{systemInfo?.version || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.sections.database.deployment')}</span>
                <p className="font-medium">{systemInfo?.deployment || 'Vercel'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.sections.database.status')}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${dbStats?.connected ? 'bg-green-500' : 'bg-destructive'}`} />
                  <span className="font-medium">{dbStats?.connected ? t('settings.sections.database.connected') : 'Disconnected'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.sections.database.environment')}</span>
                <Badge variant={systemInfo?.environment === 'production' ? 'default' : 'secondary'} className="capitalize">
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
