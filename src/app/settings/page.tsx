'use client';

import { useLanguage } from '@/lib/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Database, Shield, Info, Globe, Grid3x3, Check, Loader2 } from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  const allModules = getAllModules();

  // Fetch data
  const { data: appSettings, isLoading: settingsLoading } = useAppSettings();
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
            language === 'zh' ? '模块已启用' : 'Module enabled',
            language === 'zh' ? '模块已添加到你的列表' : 'Module added to your list'
          );
        } else {
          setActiveModules(prev => prev.filter(id => id !== moduleId));
          toast.success(
            language === 'zh' ? '模块已禁用' : 'Module disabled',
            language === 'zh' ? '模块已从你的列表移除' : 'Module removed from your list'
          );
        }
        // Reload to update sidebar
        window.location.reload();
      } catch (error) {
        toast.error(
          language === 'zh' ? '操作失败' : 'Operation failed',
          error instanceof Error ? error.message : language === 'zh' ? '请重试' : 'Please try again'
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
            {language === 'zh' ? '用户设置' : 'User Settings'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'zh' ? '管理你的模块订阅、语言和账户设置' : 'Manage your module subscriptions, language and account settings'}
          </p>
        </div>

        {/* Module Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3x3 className="w-5 h-5" />
              <span>{language === 'zh' ? '模块订阅' : 'Module Subscription'}</span>
            </CardTitle>
            <CardDescription>
              {language === 'zh' ? '选择要使用的功能模块' : 'Choose which modules to use'}
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
                              {language === 'zh' ? '已订阅' : 'Subscribed'}
                            </>
                          ) : (
                            language === 'zh' ? '订阅' : 'Subscribe'
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
              <span>{language === 'zh' ? '语言设置' : 'Language Settings'}</span>
            </CardTitle>
            <CardDescription>
              {language === 'zh' ? '选择应用程序显示语言' : 'Choose application display language'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">
                {language === 'zh' ? '语言' : t('settings.sections.app.language')}
              </Label>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <span className="text-sm text-muted-foreground">
                  {language === 'zh' ? '当前语言：中文' : 'Current language: English'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'zh'
                  ? '更改语言后立即生效，无需刷新页面'
                  : 'Language changes take effect immediately without page refresh'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>{language === 'zh' ? '安全设置' : 'Security Settings'}</span>
            </CardTitle>
            <CardDescription>
              {language === 'zh'
                ? '管理您的账户安全和密码'
                : 'Manage your account security and password'}
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
              <span>{language === 'zh' ? '系统信息' : 'System Info'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{language === 'zh' ? '版本' : 'Version'}</span>
                <p className="font-medium">{systemInfo?.version || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'zh' ? '部署' : 'Deployment'}</span>
                <p className="font-medium">{systemInfo?.deployment || 'Vercel'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'zh' ? '数据库' : 'Database'}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${dbStats?.connected ? 'bg-green-500' : 'bg-destructive'}`} />
                  <span className="font-medium">{dbStats?.connected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{language === 'zh' ? '环境' : 'Environment'}</span>
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
