'use client';

import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLanguage } from '@/lib/language-provider';
import { Separator } from '@/components/ui/separator';
import { AppBreadcrumb } from './AppBreadcrumb';
import { signOut } from 'next-auth/react';

export function AppHeader() {
  const { t } = useLanguage();

  const handleLogout = async () => {
    // eslint-disable-next-line no-alert
    if (confirm(t('auth.logoutConfirm'))) {
      try {
        await signOut({ callbackUrl: '/login' });
      } catch {
        // eslint-disable-next-line no-alert
        alert(t('common.failedToLogout'));
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb */}
      <div className="hidden md:flex">
        <AppBreadcrumb />
      </div>

      {/* Search / Command Palette Trigger */}
      <div className="flex flex-1 items-center justify-end md:justify-center">
        <Button
          variant="outline"
          className="relative h-9 w-full max-w-md justify-start text-sm text-muted-foreground"
          onClick={() => {
            // 触发 Ctrl+K 事件打开 Command Palette
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              ctrlKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('quilts.actions.search')}...</span>
          <span className="sm:hidden">搜索...</span>
          <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Separator orientation="vertical" className="h-4" />

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          title={t('auth.logout')}
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{t('auth.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
