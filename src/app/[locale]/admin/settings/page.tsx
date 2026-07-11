import { auth } from '@/auth';
import { Link, redirect } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDatabaseStats, getSystemInfo } from '@/lib/data/settings';
import { Bot, ChevronRight, Database, Settings, ShieldCheck, Users } from 'lucide-react';
import { connection } from 'next/server';

const managementLinks = [
  {
    href: '/users',
    icon: Users,
    title: { zh: '用户与权限', en: 'Users and permissions' },
    description: {
      zh: '管理家庭成员、角色和模块访问。',
      en: 'Manage household members, roles, and module access.',
    },
  },
  {
    href: '/settings',
    icon: Settings,
    title: { zh: '应用与 Agent 设置', en: 'Application and Agent settings' },
    description: {
      zh: '管理模块、账户安全和个人 Agent API key。',
      en: 'Manage modules, account security, and personal Agent API keys.',
    },
  },
  {
    href: '/cards/settings',
    icon: Bot,
    title: { zh: '卡片服务配置', en: 'Card service configuration' },
    description: {
      zh: '配置 AI、市场数据和外部服务凭据。',
      en: 'Configure AI, market data, and external service credentials.',
    },
  },
] as const;

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await connection();

  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect({ href: '/', locale });
  }

  const isZh = locale === 'zh';
  const [database, system] = await Promise.all([getDatabaseStats(), getSystemInfo()]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              {isZh ? '仅管理员可见' : 'Admin only'}
            </div>
            <h1 className="text-3xl font-bold">
              {isZh ? '系统管理中心' : 'System administration'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isZh
                ? '集中查看运行状态并进入各项管理工具。'
                : 'Review system health and open administrative tools.'}
            </p>
          </div>
          <Badge variant={database.connected ? 'default' : 'destructive'} className="w-fit">
            {database.connected
              ? isZh
                ? '数据库已连接'
                : 'Database connected'
              : isZh
                ? '数据库不可用'
                : 'Database unavailable'}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{isZh ? '应用版本' : 'Application version'}</CardDescription>
              <CardTitle>{system.version}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{isZh ? '运行环境' : 'Environment'}</CardDescription>
              <CardTitle className="capitalize">{system.environment}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{isZh ? '家庭物品记录' : 'Household item records'}</CardDescription>
              <CardTitle>{database.totalQuilts}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              {isZh ? '管理工具' : 'Management tools'}
            </CardTitle>
            <CardDescription>
              {isZh
                ? '按职责进入对应设置，避免个人设置与系统配置混在一起。'
                : 'Open settings by responsibility so personal and system configuration stay distinct.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {managementLinks.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.href}
                  className="flex h-full flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <Icon className="mb-4 size-6 text-primary" />
                  <h2 className="font-semibold">{isZh ? item.title.zh : item.title.en}</h2>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {isZh ? item.description.zh : item.description.en}
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    className="mt-4 justify-between px-0 hover:bg-transparent"
                  >
                    <Link href={item.href}>
                      {isZh ? '打开' : 'Open'}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
