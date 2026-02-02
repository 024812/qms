'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import {
  Package,
  BarChart3,
  Settings,
  Calendar,
  Github,
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

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session, status } = useSession();

  const allModules = getAllModules();

  // Get user's active modules
  const activeModuleIds = (session?.user?.activeModules as string[]) || [];
  const isAdmin = session?.user?.role === 'admin';

  // Filter modules based on user's subscriptions
  const subscribedModules = allModules.filter(module => activeModuleIds.includes(module.id));

  // Module-specific navigation items (Memoized or created inside render to access 't')
  // We'll create a helper function or object inside the component
  const getModuleNavigation = (moduleId: string) => {
    switch (moduleId) {
      case 'quilts':
        return [
          { name: t('sidebar.quiltsList'), href: '/quilts', icon: Package },
          { name: t('navigation.usage'), href: '/usage', icon: Calendar },
          { name: t('navigation.analytics'), href: '/analytics', icon: BarChart3 },
        ];
      case 'cards':
        return [
          { name: t('sidebar.cardOverview'), href: '/cards/overview', icon: BarChart3 },
          { name: t('sidebar.cardsList'), href: '/cards', icon: CreditCard },
          { name: t('sidebar.soldCards'), href: '/cards/sold', icon: CreditCard },
        ];
      default:
        return [];
    }
  };

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

  // Initialize open states on mount and when pathname or session changes
  useEffect(() => {
    // Wait for session to be loaded
    if (status === 'loading') return;

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
        pathname === '/cards/settings' ||
        isHomePage
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentModuleId, isHomePage, status]);

  // Loading state
  if (status === 'loading') {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 px-2 py-1">
            <Package className="h-6 w-6 text-blue-600 shrink-0" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-bold leading-tight">{t('common.appName')}</span>
              <span className="text-xs text-muted-foreground">{t('common.appDescription')}</span>
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
            <span className="text-sm font-bold leading-tight">{t('common.appName')}</span>
            <span className="text-xs text-muted-foreground">{t('common.appDescription')}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* My Modules - Show subscribed modules with their sub-navigation */}
        {subscribedModules.map(module => {
          const IconComponent = moduleIcons[module.icon] || Package;
          const moduleNav = getModuleNavigation(module.id);
          const isModuleActive = currentModuleId === module.id;
          const hasSubNav = moduleNav.length > 0;

          // Get translated module name if possible, or fallback to name from registry
          // Since registry names might be hardcoded in English/Chinese, it's better to translate them
          // But for now we use the name from registry. Ideally registry should return translation keys.
          const moduleName = t(`users.modules.${module.id}`) || module.name;

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
                          <SidebarMenuButton tooltip={moduleName} isActive={isModuleActive}>
                            <IconComponent className="h-4 w-4" />
                            <span>{moduleName}</span>
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
                                    item.href === '/cards' || item.href === '/quilts'
                                      ? pathname === item.href
                                      : pathname === item.href ||
                                        pathname.startsWith(item.href + '/')
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
                    <SidebarMenuButton asChild isActive={isModuleActive} tooltip={moduleName}>
                      <Link href={`/${module.id}s`} prefetch={false}>
                        <IconComponent className="h-4 w-4" />
                        <span>{moduleName}</span>
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
                        tooltip={t('sidebar.system')}
                        isActive={
                          pathname.startsWith('/users') ||
                          pathname.startsWith('/admin') ||
                          pathname === '/quilts/settings' ||
                          pathname === '/cards/settings'
                        }
                      >
                        <Wrench className="h-4 w-4" />
                        <span>{t('sidebar.system')}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/users'}>
                            <Link href="/users" prefetch={false}>
                              <Users className="h-4 w-4" />
                              <span>{t('users.title')}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/admin/settings'}>
                            <Link href="/admin/settings" prefetch={false}>
                              <Settings className="h-4 w-4" />
                              <span>{t('sidebar.configuration')}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/quilts/settings'}>
                            <Link href="/quilts/settings" prefetch={false}>
                              <Bed className="h-4 w-4" />
                              <span>{t('sidebar.quiltSettings')}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === '/cards/settings'}>
                            <Link href="/cards/settings" prefetch={false}>
                              <CreditCard className="h-4 w-4" />
                              <span>{t('sidebar.cardSettings')}</span>
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
                  tooltip={t('sidebar.userSettings')}
                >
                  <Link href="/settings" prefetch={false}>
                    <Settings className="h-4 w-4" />
                    <span>{t('sidebar.userSettings')}</span>
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
              title={t('common.github')}
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
              title={t('common.deployedOnVercel')}
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
