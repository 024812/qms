/**
 * Admin Settings Page
 * 
 * Admin-only page for system configuration.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default async function AdminSettingsPage() {
    const session = await auth();

    // Redirect non-admins
    if (!session?.user || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">系统配置</h1>
                    <p className="text-muted-foreground">
                        管理系统级别的配置和设置
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>系统设置</CardTitle>
                                <CardDescription>配置全局系统参数</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            系统配置功能开发中...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
