'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Calendar,
  BarChart3,
  Package,
  Upload,
  Download,
  Settings,
  Star,
  Clock,
  Filter,
  Zap,
  TrendingUp,
  Activity,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  onAddQuilt?: () => void;
  onSearchQuilts?: () => void;
  onViewAnalytics?: () => void;
  onStartUsage?: () => void;
  onImportData?: () => void;
  onExportData?: () => void;
  onViewSettings?: () => void;
  pendingActions?: number;
  isLoading?: boolean;
}

export function QuickActions({
  onAddQuilt,
  onSearchQuilts,
  onViewAnalytics,
  onStartUsage,
  onImportData,
  onExportData,
  onViewSettings,
  pendingActions = 0,
  isLoading = false,
}: QuickActionsProps) {
  const router = useRouter();

  const primaryActions: QuickAction[] = [
    {
      id: 'add-quilt',
      title: 'Add New Quilt',
      description: 'Register a new quilt in your collection',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: onAddQuilt,
    },
    {
      id: 'search-quilts',
      title: 'Search & Filter',
      description: 'Find quilts by season, color, or brand',
      icon: Search,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      onClick: onSearchQuilts,
    },
    {
      id: 'start-usage',
      title: 'Start Usage',
      description: 'Begin tracking quilt usage',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: onStartUsage,
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Explore usage patterns and insights',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      onClick: onViewAnalytics,
    },
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'import-data',
      title: 'Import Data',
      description: 'Upload Excel file with quilt data',
      icon: Upload,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      onClick: onImportData,
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download your collection as Excel',
      icon: Download,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      onClick: onExportData,
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      description: 'Schedule quilt care and cleaning',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      badge: pendingActions > 0 ? pendingActions.toString() : undefined,
      onClick: onViewSettings,
    },
    {
      id: 'reports',
      title: 'Generate Report',
      description: 'Create usage and inventory reports',
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      onClick: () => {
        // Navigate to reports page
        router.push('/reports');
      },
    },
  ];

  const quickFilters = [
    { id: 'winter', label: 'Winter Quilts', icon: Package, count: 0 },
    { id: 'in-use', label: 'In Use', icon: Clock, count: 0 },
    { id: 'storage', label: 'Storage', icon: Star, count: 0 },
    { id: 'maintenance', label: 'Need Maintenance', icon: Zap, count: pendingActions },
  ];
  const loadingPrimaryKeys = [
    'primary-skeleton-1',
    'primary-skeleton-2',
    'primary-skeleton-3',
    'primary-skeleton-4',
  ];
  const loadingSecondaryKeys = [
    'secondary-skeleton-1',
    'secondary-skeleton-2',
    'secondary-skeleton-3',
    'secondary-skeleton-4',
  ];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {loadingPrimaryKeys.map(key => (
              <div key={key} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {loadingSecondaryKeys.map(key => (
              <div key={key} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Quick Actions
          </div>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Common tasks and shortcuts for managing your quilts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Primary Actions
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {primaryActions.map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    'h-auto p-4 flex flex-col items-center space-y-2 border-2 transition-all duration-200 hover:shadow-md',
                    action.bgColor,
                    action.borderColor,
                    action.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <div className="relative">
                    <action.icon className={cn('h-6 w-6', action.color)} />
                    {action.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{action.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Secondary Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Data & Reports
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {secondaryActions.map(action => (
                <Button
                  key={action.id}
                  variant="ghost"
                  className={cn(
                    'h-16 flex flex-col items-center justify-center space-y-1 border border-gray-200 hover:border-gray-300 transition-all duration-200',
                    action.bgColor
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  <div className="relative">
                    <action.icon className={cn('h-5 w-5', action.color)} />
                    {action.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Quick Filters
            </h4>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map(filter => (
                <Button key={filter.id} variant="outline" size="sm" className="h-8 px-3 text-xs">
                  <filter.icon className="h-3 w-3 mr-1" />
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">System Status</span>
              </div>
              <Badge variant="outline" className="text-xs">
                All Systems Operational
              </Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {pendingActions > 0 ? (
                <p>
                  • {pendingActions} maintenance task{pendingActions > 1 ? 's' : ''} pending
                </p>
              ) : (
                <p>• All quilts are in good condition</p>
              )}
              <p>• Last sync: Just now</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
