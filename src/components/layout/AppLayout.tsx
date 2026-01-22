'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslations } from 'next-intl';
import {
  Home,
  Package,
  BarChart3,
  Settings,
  Menu,
  Search,
  User,
  Calendar,
  Github,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import packageJson from '../../../package.json';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const getNavigation = (t: (key: string) => string) => [
  {
    name: t('navigation.dashboard'),
    href: '/',
    icon: Home,
    description: t('dashboardSpecific.overviewAndStats'),
  },
  {
    name: t('navigation.quilts'),
    href: '/quilts',
    icon: Package,
    description: t('dashboardSpecific.manageCollection'),
  },
  {
    name: t('navigation.usage'),
    href: '/usage',
    icon: Calendar,
    description: t('dashboardSpecific.trackUsagePeriods'),
  },
  {
    name: t('navigation.analytics'),
    href: '/analytics',
    icon: BarChart3,
    description: t('dashboardSpecific.usageInsightsAndTrends'),
  },
  {
    name: t('navigation.reports'),
    href: '/reports',
    icon: Upload,
    description: t('dashboardSpecific.exportAndReporting'),
  },
  {
    name: t('navigation.settings'),
    href: '/settings',
    icon: Settings,
    description: t('dashboardSpecific.appConfiguration'),
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

// 从 localStorage 读取初始状态
function getInitialCollapsedState(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
  return saved === 'true';
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsedState);
  const pathname = usePathname();
  const t = useTranslations();

  const navigation = getNavigation(t);

  // 切换 sidebar 折叠状态
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('common.openSidebar')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center space-x-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-semibold leading-tight">
                    {t('common.appName')}
                    <br />
                    {t('common.appDesc')}
                  </span>
                </Link>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'mr-3 h-5 w-5 flex-shrink-0',
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              {/* Version display */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-400">
                    {t('settings.sections.system.version')} {packageJson.version}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href="https://github.com/ohengcom/qms-app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="GitHub"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    <a
                      href="https://vercel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                      title="Deployed on Vercel"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div
          className={cn(
            'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          )}
        >
          <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pt-5 pb-4 overflow-y-auto relative">
            {/* 折叠/展开按钮 */}
            <button
              onClick={toggleSidebar}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 items-center justify-center border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all',
                sidebarCollapsed
                  ? '-right-5 rounded-r-full rounded-l-none pl-1' // 收起时：右半圆贴边
                  : '-right-5 rounded-full' // 展开时：完整圆形
              )}
              title={sidebarCollapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-6 w-6 text-gray-600 dark:text-slate-300" />
              ) : (
                <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-slate-300" />
              )}
            </button>

            <div
              className={cn(
                'flex items-center flex-shrink-0',
                sidebarCollapsed ? 'px-3 justify-center' : 'px-6'
              )}
            >
              <Link href="/" className="flex items-center space-x-2">
                <Package
                  className={cn('text-blue-600', sidebarCollapsed ? 'h-6 w-6' : 'h-8 w-8')}
                />
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-base font-bold text-gray-900 leading-tight">
                      {t('common.appName')}
                      <br />
                      {t('common.appDesc')}
                    </h1>
                  </div>
                )}
              </Link>
            </div>
            <nav className={cn('mt-8 flex-1 space-y-1', sidebarCollapsed ? 'px-2' : 'px-3')}>
              {navigation.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      'group flex items-center rounded-md text-sm font-medium transition-colors',
                      sidebarCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        !sidebarCollapsed && 'mr-3',
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {!sidebarCollapsed && (
                      <div>
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-600">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
            {/* Version display */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="text-center space-y-2">
                {!sidebarCollapsed && (
                  <p className="text-xs text-gray-400">
                    {t('settings.sections.system.version')} {packageJson.version}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="https://github.com/ohengcom/qms-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  {!sidebarCollapsed && (
                    <a
                      href="https://vercel.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                      title="Deployed on Vercel"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
          )}
        >
          {/* Top header */}
          <header className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t('common.openSidebar')}</span>
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              {/* Search */}
              <div className="relative flex flex-1 items-center">
                <div className="relative w-full max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder={t('quilts.actions.search')}
                    className="block w-full rounded-md border-0 bg-gray-50 dark:bg-slate-700 py-1.5 pl-10 pr-3 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const searchTerm = (e.target as HTMLInputElement).value;
                        if (searchTerm.trim()) {
                          window.location.href = `/quilts?search=${encodeURIComponent(searchTerm)}`;
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Separator */}
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-slate-600" />

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    // eslint-disable-next-line no-alert
                    if (confirm(t('auth.logoutConfirm'))) {
                      try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                      } catch {
                        // Logout failed
                        // eslint-disable-next-line no-alert
                        alert(t('common.failedToLogout'));
                      }
                    }
                  }}
                  title={t('auth.logout')}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:block text-sm font-medium">{t('auth.logout')}</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
