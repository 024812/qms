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
  CreditCard,
  Bed,
  Users,
  Loader2,
  Wrench,
  ChevronRight,
  LucideIcon,
  LogOut,
} from 'lucide-react';
import packageJson from '../../../package.json';
import { getAllModules } from '@/modules/registry';
import { logoutUser } from '@/app/actions/logout';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      </SidebarContent>

      <SidebarFooter className="gap-0">
        {session?.user ? (
          <SidebarMenu>
            <Collapsible className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    tooltip={session.user.name || t('common.user')}
                  >
                    <Avatar className="h-8 w-8 rounded-lg border border-border">
                      <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                      <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
                        {session.user.name?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold">{session.user.email}</span>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link href="/settings" prefetch={false}>
                          <Settings className="h-4 w-4" />
                          <span>{t('sidebar.userSettings')}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        className="text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <button type="button" onClick={() => logoutUser()}>
                          <LogOut className="h-4 w-4" />
                          <span>{t('auth.signOut')}</span>
                        </button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        ) : (
          <div className="p-2">
            <div className="w-full group-data-[collapsible=icon]:hidden">
              <Link href="/api/auth/signin">
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors justify-center">
                  <span className="text-sm font-medium">{t('auth.signIn')}</span>
                </div>
              </Link>
            </div>
            {/* Icon only for collapsed state */}
            <div className="hidden group-data-[collapsible=icon]:flex justify-center">
              <Link href="/api/auth/signin" title={t('auth.signIn')}>
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  <LogOut className="h-4 w-4 rotate-180" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Links & Version - Footer bottom */}
        <div className="border-t border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:hidden">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/024812/qms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={t('common.github')}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.589 2 12.248c0 4.526 2.865 8.367 6.839 9.722.5.096.683-.221.683-.492 0-.243-.009-.887-.014-1.741-2.782.617-3.369-1.37-3.369-1.37-.454-1.176-1.11-1.489-1.11-1.489-.908-.636.069-.623.069-.623 1.004.072 1.532 1.054 1.532 1.054.892 1.565 2.341 1.113 2.91.851.091-.665.349-1.113.635-1.369-2.22-.258-4.555-1.137-4.555-5.061 0-1.118.389-2.033 1.029-2.75-.103-.259-.446-1.3.098-2.711 0 0 .84-.276 2.75 1.05A9.303 9.303 0 0 1 12 6.86a9.27 9.27 0 0 1 2.503.35c1.909-1.326 2.747-1.05 2.747-1.05.546 1.411.203 2.452.1 2.711.64.717 1.027 1.632 1.027 2.75 0 3.934-2.339 4.8-4.566 5.053.359.318.678.944.678 1.903 0 1.374-.012 2.482-.012 2.819 0 .273.18.593.688.491C19.137 20.611 22 16.772 22 12.248 22 6.589 17.523 2 12 2Z" />
                </svg>
              </a>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={t('common.deployedOnVercel')}
              >
                <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </a>
            </div>
            <span className="text-[10px] text-muted-foreground opacity-70">
              v{packageJson.version}
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
