'use client';

import { useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLanguage } from '@/lib/language-provider';
import { Separator } from '@/components/ui/separator';
import { AppBreadcrumb } from './AppBreadcrumb';
import { logoutUser } from '@/app/actions/logout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function AppHeader() {
  const { t } = useLanguage();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      setIsLoggingOut(false);
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
          className="relative h-9 w-full max-w-md justify-start text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 border-input/40"
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
          <span className="hidden sm:inline">Search system...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Separator orientation="vertical" className="h-4" />

        {/* Logout with AlertDialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              title={t('auth.logout')}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">{t('auth.logout')}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('auth.logout')}</AlertDialogTitle>
              <AlertDialogDescription>{t('auth.logoutConfirm')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoggingOut ? '...' : t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
