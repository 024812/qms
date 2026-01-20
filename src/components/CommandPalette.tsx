'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-provider';
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
  CreditCard, // For Cards
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
  const { t } = useLanguage();
  const { setTheme } = useTheme();

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

  // 搜索相关性 (Mock for now, or keep quilt search as a "feature")
  // User wants "all subsystems", implying navigation is key.
  // We will keep Quilt search as a "Smart Search" feature but ensure navigation is prominent.

  React.useEffect(() => {
    if (!open) return;

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
  }, [search, open]);

  // 导航项 - Comprehensive List
  const navigationItems = [
    { name: t('navigation.dashboard') || 'Dashboard', href: '/', icon: Home },
    { name: t('navigation.quilts') || 'Quilts Management', href: '/quilts', icon: Package },
    { name: t('navigation.cards') || 'Trading Cards', href: '/cards', icon: CreditCard },
    { name: t('navigation.usage') || 'Usage History', href: '/usage', icon: Calendar },
    { name: t('navigation.analytics') || 'Data Analytics', href: '/analytics', icon: BarChart3 },
    { name: t('navigation.reports') || 'Reports & Export', href: '/reports', icon: Upload },
    { name: t('navigation.users') || 'User Management', href: '/users', icon: Users },
    { name: t('navigation.settings') || 'System Settings', href: '/settings', icon: Settings },
  ];

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Quick navigation and search"
    >
      <CommandInput
        placeholder="Type a command or search... (Ctrl+K)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? 'Searching...' : 'No results found.'}</CommandEmpty>

        {/* 页面导航 - Always show or filter */}
        <CommandGroup heading="System Navigation">
          {navigationItems.map(item => (
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

        {/* 被子搜索结果 - Only show if results exist */}
        {quilts.length > 0 && (
          <CommandGroup heading="Quilts">
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

        {/* 主题切换 */}
        <CommandGroup heading="Theme">
          <CommandItem value="theme-light" onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem value="theme-dark" onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem value="theme-system" onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
