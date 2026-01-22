'use client';

import { useLocale, useTranslations } from 'next-intl';
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
import { MousePointerClick, Settings, ShieldAlert } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useAppSettings, useUpdateAppSettings } from '@/hooks/useSettings';
import { useSession } from 'next-auth/react';

export default function QuiltSettingsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const language = locale;
    const { data: session, status } = useSession();

    // Fetch settings
    const { data: appSettings, isLoading } = useAppSettings();
    const updateSettings = useUpdateAppSettings();

    const isAdmin = session?.user?.role === 'admin';

    const doubleClickAction =
        (appSettings?.doubleClickAction as 'none' | 'status' | 'edit' | 'view') || 'status';

    const handleDoubleClickActionChange = async (value: 'none' | 'status' | 'edit' | 'view') => {
        try {
            await updateSettings.mutateAsync({ doubleClickAction: value });
            toast.success(
                locale === 'zh' ? '设置已保存' : 'Settings saved',
                locale === 'zh' ? '双击行为已更新' : 'Double-click behavior updated'
            );
        } catch (error) {
            toast.error(
                locale === 'zh' ? '保存失败' : 'Save failed',
                error instanceof Error ? error.message : locale === 'zh' ? '请重试' : 'Please try again'
            );
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    // Non-admin access denied
    if (!isAdmin) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <ShieldAlert className="w-6 h-6" />
                                {language === 'zh' ? '访问被拒绝' : 'Access Denied'}
                            </CardTitle>
                            <CardDescription>
                                {language === 'zh'
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
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Settings className="w-8 h-8" />
                        {language === 'zh' ? '被子管理设置' : 'Quilt Management Settings'}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === 'zh' ? '配置被子管理模块的行为（仅管理员）' : 'Configure quilt management module behavior (Admin only)'}
                    </p>
                </div>

                {/* Quilt List Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <MousePointerClick className="w-5 h-5" />
                            <span>{language === 'zh' ? '交互行为' : 'Interaction Behavior'}</span>
                        </CardTitle>
                        <CardDescription>
                            {language === 'zh'
                                ? '配置被子列表的交互行为'
                                : 'Configure quilt list interaction behavior'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Quilt List Double-click */}
                        <div className="space-y-2">
                            <Label htmlFor="double-click-action">
                                {language === 'zh' ? '被子列表双击行为' : 'Quilt List Double-click Behavior'}
                            </Label>
                            <Select
                                value={doubleClickAction}
                                onValueChange={value =>
                                    handleDoubleClickActionChange(value as 'none' | 'status' | 'edit' | 'view')
                                }
                            >
                                <SelectTrigger id="double-click-action">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '无动作' : 'No Action'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh' ? '双击不执行任何操作' : 'Double-click does nothing'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="view">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '查看详情' : 'View Details'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh'
                                                    ? '双击查看被子详情'
                                                    : 'Double-click to view quilt details'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="status">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '修改状态' : 'Change Status'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh'
                                                    ? '双击打开状态修改对话框'
                                                    : 'Double-click opens status dialog'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '编辑被子' : 'Edit Quilt'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh' ? '双击打开编辑表单' : 'Double-click opens edit form'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {language === 'zh'
                                    ? '设置在被子列表中双击行时的默认行为'
                                    : 'Set the default behavior when double-clicking a row in the quilt list'}
                            </p>
                        </div>

                        {/* Usage Record Double-click */}
                        <div className="space-y-2">
                            <Label htmlFor="usage-double-click-action">
                                {language === 'zh' ? '使用记录双击行为' : 'Usage Record Double-click Behavior'}
                            </Label>
                            <Select
                                value={(appSettings?.usageDoubleClickAction as string) || 'view'}
                                onValueChange={async value => {
                                    try {
                                        await updateSettings.mutateAsync({
                                            usageDoubleClickAction: value as 'none' | 'view' | 'edit',
                                        });
                                        toast.success(
                                            language === 'zh' ? '设置已保存' : 'Settings saved',
                                            language === 'zh'
                                                ? '使用记录双击行为已更新'
                                                : 'Usage record double-click behavior updated'
                                        );
                                    } catch (error) {
                                        toast.error(
                                            language === 'zh' ? '保存失败' : 'Save failed',
                                            error instanceof Error
                                                ? error.message
                                                : language === 'zh'
                                                    ? '请重试'
                                                    : 'Please try again'
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger id="usage-double-click-action">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '无动作' : 'No Action'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh' ? '双击不执行任何操作' : 'Double-click does nothing'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="view">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '查看详情' : 'View Details'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh'
                                                    ? '双击查看被子详情'
                                                    : 'Double-click to view quilt details'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">
                                                {language === 'zh' ? '编辑记录' : 'Edit Record'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {language === 'zh'
                                                    ? '双击编辑使用记录'
                                                    : 'Double-click to edit usage record'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {locale === 'zh'
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
