/**
 * Dashboard Layout
 * 
 * This layout wraps all authenticated pages with:
 * - Sidebar navigation
 * - Header with user menu
 * - Command palette
 * 
 * Requirements: 4.1 (UI components and layout)
 */

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { CommandPalette } from '@/components/CommandPalette';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
