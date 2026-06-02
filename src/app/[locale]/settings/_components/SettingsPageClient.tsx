'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppSettings, useDatabaseStats, useSystemInfo } from '@/hooks/useSettings';
import { toast } from '@/lib/toast';
import { getAllModules } from '@/modules/registry';
import { getUserActiveModules, toggleModuleSubscription } from '@/app/actions/modules';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Grid3x3,
  Info,
  KeyRound,
  Loader2,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  createUserApiKeyAction,
  listUserApiKeysAction,
  revokeUserApiKeyAction,
} from '@/app/actions/settings';

import type { AppSettings, DatabaseStats, SystemInfo } from '@/lib/types/settings';
import type { UserApiKeySummary } from '@/lib/data/user-api-keys';

interface SettingsPageClientProps {
  initialAppSettings: AppSettings | null;
  initialDatabaseStats: DatabaseStats | null;
  initialSystemInfo: SystemInfo | null;
  initialApiKeys: UserApiKeySummary[];
  initialActiveModules: string[];
}

export function SettingsPageClient({
  initialAppSettings,
  initialDatabaseStats,
  initialSystemInfo,
  initialApiKeys,
  initialActiveModules,
}: SettingsPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeModules, setActiveModules] = useState(initialActiveModules);
  const [loadingModules, setLoadingModules] = useState(false);
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [apiKeyPending, setApiKeyPending] = useState(false);

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

  const refreshApiKeys = async () => {
    const result = await listUserApiKeysAction();
    if (result.success) {
      setApiKeys(result.data);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) return;
    setApiKeyPending(true);

    try {
      const result = await createUserApiKeyAction({ name: newApiKeyName });
      if (!result.success) {
        toast.error('API key 创建失败', result.error.message);
        return;
      }

      setCreatedApiKey(result.data.key);
      setNewApiKeyName('');
      await refreshApiKeys();
      toast.success('API key 已创建', '请立即复制，新 key 只会显示一次。');
    } finally {
      setApiKeyPending(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    setApiKeyPending(true);

    try {
      const result = await revokeUserApiKeyAction({ id });
      if (!result.success) {
        toast.error('API key 撤销失败', result.error.message);
        return;
      }

      setApiKeys(previous => previous.filter(key => key.id !== id));
      toast.success('API key 已撤销');
    } finally {
      setApiKeyPending(false);
    }
  };

  const handleCopyCreatedApiKey = async () => {
    if (!createdApiKey) return;
    await navigator.clipboard.writeText(createdApiKey);
    toast.success('已复制 API key');
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
              <KeyRound className="h-5 w-5" />
              <span>Agent API Keys</span>
            </CardTitle>
            <CardDescription>
              为 OpenClaw 或其他 AI agent 创建个人 API key。key 的可访问子系统与当前用户权限一致。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newApiKeyName}
                onChange={event => setNewApiKeyName(event.target.value)}
                placeholder="例如 OpenClaw Desktop"
                disabled={apiKeyPending}
              />
              <Button
                onClick={handleCreateApiKey}
                disabled={apiKeyPending || !newApiKeyName.trim()}
                className="sm:w-32"
              >
                {apiKeyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '创建'}
              </Button>
            </div>

            {createdApiKey && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="mb-2 font-medium text-amber-900 dark:text-amber-100">
                  请立即复制，此 key 只显示一次。
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded bg-background px-2 py-1 text-xs">
                    {createdApiKey}
                  </code>
                  <Button size="icon" variant="outline" onClick={handleCopyCreatedApiKey}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">还没有创建 API key。</p>
              ) : (
                apiKeys.map(apiKey => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{apiKey.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {apiKey.keyPrefix}... · 创建于{' '}
                        {new Date(apiKey.createdAt).toLocaleString(locale)}
                        {apiKey.lastUsedAt
                          ? ` · 最近使用 ${new Date(apiKey.lastUsedAt).toLocaleString(locale)}`
                          : ''}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={apiKeyPending}
                      onClick={() => handleRevokeApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button variant="outline" asChild>
              <a href="/AGENT_API.md" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                查看 Agent API 文档
              </a>
            </Button>
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
