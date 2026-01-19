'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/language-provider';
import { Home, Package, BarChart3, Settings, Calendar, Github, Upload, Grid3x3, CreditCard, Bed, User } from 'lucide-react';
import packageJson from '../../../package.json';
import { getAllModules } from '@/modules/registry';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

// Icon mapping for modules
const moduleIcons: Record<string, any> = {
  Bed,
  CreditCard,
  Package,
};

const getStaticNavigation = (t: (key: string) => string) => [
  {
    name: t('navigation.dashboard'),
    href: '/',
    icon: Home,
  },
  {
    name: t('navigation.usage'),
    href: '/usage',
    icon: Calendar,
  },
  {
    name: t('navigation.analytics'),
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: t('navigation.reports'),
    href: '/reports',
    icon: Upload,
  },
  {
    name: t('navigation.settings'),
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  
  const staticNavigation = getStaticNavigation(t);
  const allModules = getAllModules();
  
  // Get user's active modules (default to empty array if no session)
  const activeModuleIds = session?.user?.activeModules || [];
  
  // Debug logging
  console.log('AppSidebar - Session status:', status);
  console.log('AppSidebar - Active modules:', activeModuleIds);
  console.log('AppSidebar - All modules:', allModules.map(m => m.id));
  
  // Filter modules based on user's active modules
  const activeModules = allModules.filter(module => activeModuleIds.includes(module.id));
  
  console.log('AppSidebar - Filtered active modules:', activeModules.map(m => m.name));
  
  // Create module navigation items
  const moduleNavigation = activeModules.map(module => ({
    name: module.name,
    href: `/${module.id}s`, // e.g., /quilts, /cards
    icon: moduleIcons[module.icon] || Package,
  }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <Package className="h-6 w-6 text-blue-600 shrink-0" />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-tight">QMS</span>
            <span className="text-xs text-muted-foreground">家庭物品管理系统</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Static Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>主菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {staticNavigation.map(item => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link href={item.href} prefetch={false}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Module Navigation */}
        {moduleNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>我的模块</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {moduleNavigation.map(item => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                        <Link href={item.href} prefetch={false}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Module Management */}
        <SidebarGroup>
          <SidebarGroupLabel>管理</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/modules'} tooltip="模块管理">
                  <Link href="/modules" prefetch={false}>
                    <Grid3x3 className="h-4 w-4" />
                    <span>模块管理</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(() => {
                const isAdmin = session?.user?.role === 'admin';
                console.log('AppSidebar - User role:', session?.user?.role);
                console.log('AppSidebar - Is admin:', isAdmin);
                return isAdmin ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/users'} tooltip="用户管理">
                      <Link href="/users" prefetch={false}>
                        <User className="h-4 w-4" />
                        <span>用户管理</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null;
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col items-center gap-2 py-2">
          <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {t('common.version')} {packageJson.version}
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ohengcom/qms-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
              title="Deployed on Vercel"
            >
              <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </a>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
