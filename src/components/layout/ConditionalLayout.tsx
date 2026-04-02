'use client';

import { usePathname } from '@/i18n/routing';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { CommandPalette } from '@/components/CommandPalette';

/**
 * Conditional Layout Wrapper
 *
 * Excludes the application shell for public pages like login and register.
 * Dashboard pages use the shared sidebar/header shell from this component.
 */
export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that should not use the authenticated app shell
  const publicPages = ['/login', '/register'];

  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  // For pages not in the (dashboard) route group, provide the layout
  // (dashboard) route group has its own layout.tsx
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
