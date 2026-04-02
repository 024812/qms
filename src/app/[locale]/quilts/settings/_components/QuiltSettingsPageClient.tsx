'use client';

import { useLocale } from 'next-intl';
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
  const locale = useLocale();
  const isZh = locale === 'zh';
  const { data: appSettings, isLoading } = useAppSettings({
    initialData: initialAppSettings ?? undefined,
  });
  const updateSettings = useUpdateAppSettings();

  const doubleClickAction = appSettings?.doubleClickAction || 'status';
  const usageDoubleClickAction = appSettings?.usageDoubleClickAction || 'view';

  const handleSave = async (
    values: Partial<Pick<AppSettings, 'doubleClickAction' | 'usageDoubleClickAction'>>,
    successTitle: string,
    successMessage: string
  ) => {
    try {
      await updateSettings.mutateAsync(values);
      toast.success(successTitle, successMessage);
    } catch (error) {
      toast.error(
        isZh ? '保存失败' : 'Save failed',
        error instanceof Error ? error.message : isZh ? '请重试' : 'Please try again'
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
                {isZh ? '访问被拒绝' : 'Access Denied'}
              </CardTitle>
              <CardDescription>
                {isZh
                  ? '只有管理员可以访问被子管理设置。'
                  : 'Only administrators can access quilt management settings.'}
              </CardDescription>
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
            {isZh ? '被子管理设置' : 'Quilt Management Settings'}
          </h1>
          <p className="text-muted-foreground">
            {isZh
              ? '配置被子管理模块的交互行为（仅管理员）'
              : 'Configure quilt management module behavior (Admin only)'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MousePointerClick className="h-5 w-5" />
              <span>{isZh ? '交互行为' : 'Interaction Behavior'}</span>
            </CardTitle>
            <CardDescription>
              {isZh
                ? '配置被子列表和使用记录的默认双击行为'
                : 'Configure default double-click behavior'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="double-click-action">
                {isZh ? '被子列表双击行为' : 'Quilt List Double-click Behavior'}
              </Label>
              <Select
                value={doubleClickAction}
                onValueChange={value =>
                  handleSave(
                    { doubleClickAction: value as AppSettings['doubleClickAction'] },
                    isZh ? '设置已保存' : 'Settings saved',
                    isZh ? '双击行为已更新' : 'Double-click behavior updated'
                  )
                }
              >
                <SelectTrigger id="double-click-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isZh ? '无动作' : 'No Action'}</SelectItem>
                  <SelectItem value="view">{isZh ? '查看详情' : 'View Details'}</SelectItem>
                  <SelectItem value="status">{isZh ? '修改状态' : 'Change Status'}</SelectItem>
                  <SelectItem value="edit">{isZh ? '编辑被子' : 'Edit Quilt'}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? '设置在被子列表中双击行时的默认行为'
                  : 'Set the default behavior when double-clicking a row in the quilt list'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage-double-click-action">
                {isZh ? '使用记录双击行为' : 'Usage Record Double-click Behavior'}
              </Label>
              <Select
                value={usageDoubleClickAction}
                onValueChange={value =>
                  handleSave(
                    { usageDoubleClickAction: value as AppSettings['usageDoubleClickAction'] },
                    isZh ? '设置已保存' : 'Settings saved',
                    isZh ? '使用记录双击行为已更新' : 'Usage record double-click behavior updated'
                  )
                }
              >
                <SelectTrigger id="usage-double-click-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isZh ? '无动作' : 'No Action'}</SelectItem>
                  <SelectItem value="view">{isZh ? '查看详情' : 'View Details'}</SelectItem>
                  <SelectItem value="edit">{isZh ? '编辑记录' : 'Edit Record'}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isZh
                  ? '设置在使用记录列表中双击行时的默认行为'
                  : 'Set the default behavior when double-clicking a row in the usage record list'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
