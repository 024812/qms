'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  BarChart3,
  Calendar,
  CreditCard,
  Bed,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth/client';
import { getAllModules } from '@/modules/registry';

const moduleIcons: Record<string, LucideIcon> = {
  Bed,
  CreditCard,
  Package,
};

interface SubNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export function WelcomePage() {
  const t = useTranslations();
  const { data: session } = useSession();

  const allModules = getAllModules();
  const activeModuleIds = (session?.user?.activeModules as string[]) || [];
  const subscribedModules = allModules.filter(m => activeModuleIds.includes(m.id));

  const getModuleNavigation = (moduleId: string): SubNavItem[] => {
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

  const moduleColorMap: Record<string, { text: string; bg: string }> = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
    green: { text: 'text-green-600', bg: 'bg-green-100' },
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      {/* Header Section */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading mb-3">
          {t('welcome.title')}
        </h1>
        <p className="text-lg text-muted-foreground flex items-center justify-center md:justify-start gap-2">
          {t('welcome.subtitle')}
        </p>
      </div>

      {/* Subscribed Modules */}
      {subscribedModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscribedModules.map(module => {
            const IconComponent = moduleIcons[module.icon] || Package;
            const colors = moduleColorMap[module.color] || moduleColorMap.blue;
            const navItems = getModuleNavigation(module.id);

            return (
              <Card
                key={module.id}
                className="group hover:shadow-md transition-all duration-200 border-muted/60"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}
                    >
                      <IconComponent className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-heading">{module.name}</CardTitle>
                      <CardDescription className="text-xs">{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {navItems.map(item => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.name}
                          <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">{t('welcome.noModules')}</p>
            <Button asChild>
              <Link href="/modules">{t('welcome.subscribeModules')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
