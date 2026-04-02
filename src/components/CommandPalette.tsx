'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Home,
  Monitor,
  Moon,
  Package,
  Settings,
  Sun,
  Upload,
  Users,
} from 'lucide-react';

import { getQuiltsAction } from '@/app/actions/quilts';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useRouter } from '@/i18n/routing';

interface CommandPaletteQuilt {
  id: string;
  name: string;
  color: string | null;
  location: string;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [quilts, setQuilts] = React.useState<CommandPaletteQuilt[]>([]);
  const [loading, setLoading] = React.useState(false);

  const router = useRouter();
  const t = useTranslations();
  const { setTheme } = useTheme();
  const { data: session } = useSession();

  const activeModules = React.useMemo(
    () => session?.user?.activeModules || [],
    [session?.user?.activeModules]
  );
  const isAdmin = session?.user?.role === 'ADMIN';

  const canAccess = React.useCallback(
    (moduleName: string) => {
      if (isAdmin) return true;
      return activeModules.includes(moduleName);
    },
    [activeModules, isAdmin]
  );

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(value => !value);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    if (!canAccess('quilts')) {
      setQuilts([]);
      return;
    }

    const searchQuilts = async () => {
      if (search.length < 2) {
        setQuilts([]);
        return;
      }

      setLoading(true);
      try {
        const result = await getQuiltsAction({
          filters: { search },
          take: 5,
          skip: 0,
          sortBy: 'itemNumber',
          sortOrder: 'asc',
        });

        if (!result.success) {
          setQuilts([]);
          return;
        }

        setQuilts(
          result.data.quilts.map(quilt => ({
            id: quilt.id,
            name: quilt.name,
            color: quilt.color,
            location: quilt.location,
          }))
        );
      } catch (error) {
        console.error('Failed to search quilts:', error);
        setQuilts([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchQuilts, 300);
    return () => clearTimeout(debounce);
  }, [canAccess, open, search]);

  const allNavigationItems = [
    { name: t('navigation.dashboard') || 'Dashboard', href: '/', icon: Home, requiredModule: null },
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
    },
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
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Settings,
      requiredModule: null,
    },
  ];

  const filteredNavigation = allNavigationItems.filter(item => {
    if (!item.requiredModule) return true;
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
                    {[quilt.color, quilt.location].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

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
