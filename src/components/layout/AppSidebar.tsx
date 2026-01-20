'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/language-provider';
import { useState, useEffect } from 'react';
import {
  Package,
  BarChart3,
  Settings,
  Calendar,
  Github,
  Upload,
  CreditCard,
  Bed,
  Users,
  Loader2,
  Wrench,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import packageJson from '../../../package.json';
import { getAllModules } from '@/modules/registry';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const moduleIcons: Record<string, LucideIcon> = {
  Bed,
  CreditCard,
  Package,
};

// Module-specific navigation items
const moduleNavigation: Record<string, Array<{ name: string; href: string; icon: LucideIcon }>> = {
  quilts: [
    { name: '被子列表', href: '/quilts', icon: Package },
    { name: '使用跟踪', href: '/usage', icon: Calendar },
    { name: '数据分析', href: '/analytics', icon: BarChart3 },
  ],
  cards: [
    { name: '卡片列表', href: '/cards', icon: CreditCard },
    // Add more card-specific navigation as needed
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session, status } = useSession();

  const allModules = getAllModules();

  // Get user's active modules
  const activeModuleIds = (session?.user?.activeModules as string[]) || [];
  const isAdmin = session?.user?.role === 'admin';

  // Filter modules based on user's subscriptions
  const subscribedModules = allModules.filter(module => activeModuleIds.includes(module.id));

  // Determine which module is currently active based on pathname
  const getCurrentModuleId = () => {
    if (
      pathname.startsWith('/quilts') ||
      pathname.startsWith('/usage') ||
      pathname.startsWith('/analytics')
    ) {
      return 'quilts';
    }
    if (pathname.startsWith('/cards')) {
      return 'cards';
    }
    return null;
  };

  const currentModuleId = getCurrentModuleId();

  // On homepage, expand all modules by default
  const isHomePage = pathname === '/' || pathname === '/modules';

  // State for controlling collapsible sections
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [adminOpen, setAdminOpen] = useState(false);

  // Initialize open states on mount and when pathname changes
  useEffect(() => {
    const newOpenStates: Record<string, boolean> = {};

    subscribedModules.forEach(module => {
      // Open if it's the current module or if we're on homepage
      newOpenStates[module.id] = module.id === currentModuleId || isHomePage;
    });

    setOpenModules(newOpenStates);

    // Open admin section if on admin pages or homepage
    setAdminOpen(
      pathname.startsWith('/users') ||
        pathname.startsWith('/admin') ||
        pathname === '/quilts/settings' ||
        isHomePage
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentModuleId, isHomePage]);

  // Loading state
  if (status === 'loading') {
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

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
        {/* My Modules - Show subscribed modules with their sub-navigation */}
        {subscribedModules.map(module => {
          const IconComponent = moduleIcons[module.icon] || Package;
          const moduleNav = moduleNavigation[module.id] || [];
          const isModuleActive = currentModuleId === module.id;
          const hasSubNav = moduleNav.length > 0;

          if (hasSubNav) {
            return (
              <SidebarGroup key={module.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <Collapsible
                      asChild
                      open={openModules[module.id] || false}
                      onOpenChange={open =>
                        setOpenModules(prev => ({ ...prev, [module.id]: open }))
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={module.name} isActive={isModuleActive}>
                            <IconComponent className="h-4 w-4" />
                            <span>{module.name}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {moduleNav.map(item => (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={
                                    pathname === item.href || pathname.startsWith(item.href + '/')
                                  }
                                >
                                  <Link href={item.href} prefetch={false}>
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Module without sub-navigation
          return (
            <SidebarGroup key={module.id}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isModuleActive} tooltip={module.name}>
                      <Link href={`/${module.id}s`} prefetch={false}>
                        <IconComponent className="h-4 w-4" />
                        <span>{module.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Admin Section - Only visible to admins, collapsible */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  asChild
                  open={adminOpen}
                  onOpenChange={setAdminOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip="系统管理"
                        isActive={
                          pathname.startsWith('/users') ||
                          pathname.startsWith('/admin') ||
                          pathname === '/quilts/settings'
                        }
                      >
                        <Wrench className="h-4 w-4" />
                        <span>系统管理</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/users'}>
                            <Link href="/users" prefetch={false}>
                              <Users className="h-4 w-4" />
                              <span>用户管理</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/admin/settings'}>
                            <Link href="/admin/settings" prefetch={false}>
                              <Settings className="h-4 w-4" />
                              <span>系统配置</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/quilts/settings'}>
                            <Link href="/quilts/settings" prefetch={false}>
                              <Bed className="h-4 w-4" />
                              <span>被子管理设置</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Settings - Visible to all users */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings' || pathname === '/modules'}
                  tooltip="用户设置"
                >
                  <Link href="/settings" prefetch={false}>
                    <Settings className="h-4 w-4" />
                    <span>用户设置</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
