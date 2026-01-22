/**
 * Module Selector Component
 * 
 * Client component that displays available modules and handles subscription.
 * 
 * Requirements: 5.1, 8.2
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllModules } from '@/modules/registry';
import { toggleModuleSubscription, getUserActiveModules } from '@/app/actions/modules';
import { useToast } from '@/hooks/useToast';
import { Loader2, Check, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export function ModuleSelector() {
  const router = useRouter();
  const { success, error: showError } = useToast();
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
        showError('加载失败', '无法加载您的模块订阅信息');
      } finally {
        setLoading(false);
      }
    }

    loadActiveModules();
  }, [showError]);

  const handleToggleModule = async (moduleId: string) => {
    setTogglingModule(moduleId);

    try {
      const result = await toggleModuleSubscription(moduleId);

      if (result.success) {
        // Update local state
        if (result.subscribed) {
          setActiveModules([...activeModules, moduleId]);
        } else {
          setActiveModules(activeModules.filter((m) => m !== moduleId));
        }

        success(
          result.subscribed ? '订阅成功' : '取消订阅成功',
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
        '操作失败',
        err instanceof Error ? err.message : '无法更新模块订阅'
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
        {allModules.map((module) => {
          const isSubscribed = activeModules.includes(module.id);
          const isToggling = togglingModule === module.id;
          const IconComponent = (LucideIcons as any)[module.icon] || LucideIcons.Package;

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
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      module.color === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : module.color === 'purple'
                          ? 'bg-purple-100 text-purple-600'
                          : module.color === 'green'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  {isSubscribed && (
                    <Badge variant="default" className="ml-2">
                      <Check className="w-3 h-3 mr-1" />
                      已订阅
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{module.name}</CardTitle>
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
                      处理中...
                    </>
                  ) : isSubscribed ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      已订阅
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      订阅模块
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
              <h3 className="font-medium mb-1">关于模块订阅</h3>
              <p className="text-sm text-muted-foreground">
                订阅模块后，您可以在导航栏中访问该模块的功能。如果您只订阅了一个模块，系统会在登录后直接跳转到该模块页面。您可以随时在此页面管理您的模块订阅。当前已订阅 {activeModules.length} 个模块。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
