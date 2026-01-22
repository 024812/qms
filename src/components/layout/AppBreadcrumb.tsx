'use client';

import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import React from 'react';

// 路由到面包屑名称的映射
const getRouteNames = (t: (key: string) => string): Record<string, string> => ({
  '': t('navigation.dashboard'),
  quilts: t('navigation.quilts'),
  usage: t('navigation.usage'),
  analytics: t('navigation.analytics'),
  reports: t('navigation.reports'),
  settings: t('navigation.settings'),
});

export function AppBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations();
  const routeNames = getRouteNames(t);

  // 解析路径段
  const segments = pathname.split('/').filter(Boolean);

  // 如果是首页，不显示面包屑
  if (segments.length === 0) {
    return null;
  }

  // 构建面包屑项
  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // 获取显示名称
    let name = routeNames[segment] || segment;

    // 如果是数字ID，显示为"详情"
    if (/^\d+$/.test(segment)) {
      name = '详情';
    }

    return { href, name, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* 首页链接 */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">{t('navigation.dashboard')}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map(item => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
