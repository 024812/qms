/**
 * Module Selector Component
 *
 * Client component that displays available modules and handles subscription.
 *
 * Requirements: 5.1, 8.2
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllModules } from '@/modules/registry';
import { toggleModuleSubscription, getUserActiveModules } from '@/app/actions/modules';
import { useToast } from '@/hooks/useToast';
import { Loader2, Check, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

function getModuleIcon(iconName: string): LucideIcon {
  const candidate = LucideIcons[iconName as keyof typeof LucideIcons];
  return typeof candidate === 'function' ? (candidate as LucideIcon) : LucideIcons.Package;
}

const MODULE_COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  '#FF6B35': { bg: 'bg-orange-100', text: 'text-orange-600' },
  '#722F37': { bg: 'bg-rose-100', text: 'text-rose-700' },
  '#8B4513': { bg: 'bg-amber-100', text: 'text-amber-700' },
  '#4A90E2': { bg: 'bg-sky-100', text: 'text-sky-600' },
};

export function ModuleSelector() {
  const { success, error: showError } = useToast();
  const t = useTranslations('modules');
  const tu = useTranslations('users');
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  const allModules = getAllModules();

  // Load user's active modules
  useEffect(() => {
    async function loadActiveModules() {
      try {
        const modules = await getUserActiveModules();
        setActiveModules(modules);
      } catch (error) {
        console.error('Failed to load active modules:', error);
        showError(t('loadErrorTitle'), t('loadErrorDescription'));
      } finally {
        setLoading(false);
      }
    }

    loadActiveModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleModule = async (moduleId: string) => {
    setTogglingModule(moduleId);

    try {
      const result = await toggleModuleSubscription(moduleId);

      if (result.success) {
        // Update local state
        if (result.subscribed) {
          setActiveModules([...activeModules, moduleId]);
        } else {
          setActiveModules(activeModules.filter(m => m !== moduleId));
        }

        success(
          result.subscribed ? t('subscribeSuccess') : t('unsubscribeSuccess'),
          result.message
        );

        // Refresh the page to update session and sidebar
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to toggle module:', err);
      showError(
        t('operationFailed'),
        err instanceof Error ? err.message : t('updateErrorDescription')
      );
    } finally {
      setTogglingModule(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allModules.map(module => {
          const isSubscribed = activeModules.includes(module.id);
          const isToggling = togglingModule === module.id;
          const IconComponent = getModuleIcon(module.icon);
          const colors = MODULE_COLOR_CLASSES[module.color] || MODULE_COLOR_CLASSES.blue;

          return (
            <Card
              key={module.id}
              className={`transition-all hover:shadow-lg ${
                isSubscribed ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {isSubscribed && (
                    <Badge variant="default" className="ml-2">
                      <Check className="w-3 h-3 mr-1" />
                      {t('subscribed')}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{tu(`modules.${module.id}`)}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleToggleModule(module.id)}
                  disabled={isToggling}
                  variant={isSubscribed ? 'outline' : 'default'}
                  className="w-full"
                >
                  {isToggling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('processing')}
                    </>
                  ) : isSubscribed ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t('subscribed')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('subscribeModule')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <LucideIcons.Info className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1">{t('aboutTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('aboutDescription', { count: activeModules.length })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
