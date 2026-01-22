'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react'; // Session Context
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Package,
  BarChart3,
  Settings,
  Calendar,
  Upload,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface Quilt {
  id: number;
  name: string;
  color: string;
  location: string;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [quilts, setQuilts] = React.useState<Quilt[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const t = useTranslations();
  const { setTheme } = useTheme();

  // Get Access Control List from Session
  const { data: session } = useSession();
  const activeModules = session?.user?.activeModules || [];
  const isAdmin = session?.user?.role === 'ADMIN';

  // Permission Check Helpers
  const canAccess = (moduleName: string) => {
    // Admin has access to everything by default, or verify specific modules
    if (isAdmin) return true;
    return activeModules.includes(moduleName);
  };

  // 监听 Ctrl+K 快捷键
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Smart Search (Quilts) - Only if authorized
  React.useEffect(() => {
    if (!open) return;

    // Permission Barrier: Short circuit if user doesn't have 'quilts' access
    if (!canAccess('quilts')) {
      setQuilts([]);
      return;
    }

    // Only search quilts if typed query is long enough
    const searchQuilts = async () => {
      if (search.length < 2) {
        setQuilts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/quilts?search=${encodeURIComponent(search)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setQuilts(data.quilts || []);
        }
      } catch (error) {
        console.error('Failed to search quilts:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchQuilts, 300);
    return () => clearTimeout(debounce);
  }, [search, open, activeModules, isAdmin]); // Add dependencies

  // Navigation Items - Filtered by Permissions
  // Module keys should match what's in the DB/NextAuth session
  const allNavigationItems = [
    { name: t('navigation.dashboard') || 'Dashboard', href: '/', icon: Home, requiredModule: null }, // Public
    {
      name: t('navigation.quilts') || 'Quilts',
      href: '/quilts',
      icon: Package,
      requiredModule: 'quilts',
    },
    {
      name: t('navigation.cards') || 'Trading Cards',
      href: '/cards',
      icon: CreditCard,
      requiredModule: 'cards',
    },
    {
      name: t('navigation.usage') || 'Usage History',
      href: '/usage',
      icon: Calendar,
      requiredModule: 'quilts',
    }, // Usage bundled with Quilts usually
    {
      name: t('navigation.analytics') || 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      requiredModule: 'analytics',
    },
    {
      name: t('navigation.reports') || 'Reports',
      href: '/reports',
      icon: Upload,
      requiredModule: 'reports',
    },
    {
      name: t('users.title'),
      href: '/users',
      icon: Users,
      requiredModule: 'admin',
    }, // Or check role === ADMIN
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Settings,
      requiredModule: null,
    }, // Settings usually open, or subset restricted
  ];

  const filteredNavigation = allNavigationItems.filter(item => {
    if (!item.requiredModule) return true; // Public items
    if (item.requiredModule === 'admin') return isAdmin;
    return canAccess(item.requiredModule);
  });

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('commandPalette.title')}
      description={t('commandPalette.description')}
    >
      <CommandInput
        placeholder={t('commandPalette.placeholder')}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? t('common.loading') : t('commandPalette.noResults')}</CommandEmpty>

        {/* System Navigation - Dynamic based on permissions */}
        <CommandGroup heading={t('commandPalette.headers.navigation')}>
          {filteredNavigation.map(item => (
            <CommandItem
              key={item.href}
              value={`nav-${item.name}`}
              onSelect={() => runCommand(() => router.push(item.href))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quilt Search Results - Only shown if authorized */}
        {quilts.length > 0 && canAccess('quilts') && (
          <CommandGroup heading={t('commandPalette.headers.quilts')}>
            {quilts.map(quilt => (
              <CommandItem
                key={quilt.id}
                value={`quilt-${quilt.id}-${quilt.name}`}
                onSelect={() => runCommand(() => router.push(`/quilts/${quilt.id}`))}
              >
                <Package className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{quilt.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {quilt.color} · {quilt.location}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Theme Toggles */}
        <CommandGroup heading={t('commandPalette.headers.theme')}>
          <CommandItem value="theme-light" onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.light')}</span>
          </CommandItem>
          <CommandItem value="theme-dark" onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.dark')}</span>
          </CommandItem>
          <CommandItem value="theme-system" onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.system')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
