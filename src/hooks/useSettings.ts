'use client';

/**
 * Settings Hooks - REST API + React Query
 *
 * Refactored from tRPC to use fetch + React Query.
 * Maintains the same interface and functionality.
 *
 * Requirements: 1.2, 1.3 - REST API migration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys for cache management
const SETTINGS_KEY = ['settings'] as const;
const DATABASE_STATS_KEY = ['database-stats'] as const;
const SYSTEM_INFO_KEY = ['system-info'] as const;
const EXPORT_KEY = ['export'] as const;

// ============================================================================
// Types
// ============================================================================

interface AppSettings {
  appName: string;
  language: 'zh' | 'en';
  itemsPerPage: number;
  defaultView: 'list' | 'grid';
  doubleClickAction: 'none' | 'view' | 'status' | 'edit';
  usageDoubleClickAction: 'none' | 'view' | 'edit';
}

interface UpdateAppSettingsInput {
  appName?: string;
  language?: 'zh' | 'en';
  itemsPerPage?: number;
  defaultView?: 'list' | 'grid';
  doubleClickAction?: 'none' | 'view' | 'status' | 'edit';
  usageDoubleClickAction?: 'none' | 'view' | 'edit';
}

interface DatabaseStats {
  totalQuilts: number;
  totalUsageRecords: number;
  activeUsage: number;
  provider: string;
  connected: boolean;
}

interface SystemInfo {
  version: string;
  framework: string;
  deployment: string;
  database: string;
  nodeVersion: string;
  environment: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface ExportData {
  exportDate: string;
  quilts: unknown[];
  usageRecords: unknown[];
}

// API response type for unified format
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch application settings from REST API
 */
async function fetchAppSettings(): Promise<AppSettings> {
  const response = await fetch('/api/settings');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取应用设置失败' }));
    throw new Error(error.error?.message || error.error || '获取应用设置失败');
  }

  const result: ApiResponse<{ settings: AppSettings }> = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.settings || (result.data as unknown as AppSettings);
  }

  // Fallback for old format (backward compatibility)
  return result as unknown as AppSettings;
}

/**
 * Update application settings via REST API
 */
async function updateAppSettings(
  data: UpdateAppSettingsInput
): Promise<{ success: boolean; settings: UpdateAppSettingsInput }> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '更新应用设置失败' }));
    throw new Error(error.error?.message || error.error || '更新应用设置失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return { success: true, settings: result.data.settings || data };
  }

  return result;
}

/**
 * Fetch database statistics from REST API
 */
async function fetchDatabaseStats(): Promise<DatabaseStats> {
  const response = await fetch('/api/settings/database-stats');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取数据库统计失败' }));
    throw new Error(error.error?.message || error.error || '获取数据库统计失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.stats || result.data;
  }

  return result;
}

/**
 * Fetch system information from REST API
 */
async function fetchSystemInfo(): Promise<SystemInfo> {
  const response = await fetch('/api/settings/system-info');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取系统信息失败' }));
    throw new Error(error.error?.message || error.error || '获取系统信息失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.systemInfo || result.data;
  }

  return result;
}

/**
 * Change password via REST API
 */
async function changePassword(
  data: ChangePasswordInput
): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/settings/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '修改密码失败' }));
    throw new Error(error.error?.message || error.error || '修改密码失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success !== undefined) {
    return { success: result.success, message: result.data?.message || '密码修改成功' };
  }

  return result;
}

/**
 * Export all data via REST API
 */
async function fetchExportData(): Promise<ExportData> {
  const response = await fetch('/api/settings/export');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '导出数据失败' }));
    throw new Error(error.error?.message || error.error || '导出数据失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data;
  }

  return result;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch application settings
 */
export function useAppSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchAppSettings,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to update application settings with optimistic updates
 */
export function useUpdateAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppSettings,
    // Optimistic update
    onMutate: async newSettings => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_KEY });

      const previousSettings = queryClient.getQueryData<AppSettings>(SETTINGS_KEY);

      // Optimistically update settings
      queryClient.setQueryData<AppSettings>(SETTINGS_KEY, old => {
        if (!old) return old;
        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(SETTINGS_KEY, context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}

/**
 * Hook to fetch database statistics
 */
export function useDatabaseStats() {
  return useQuery({
    queryKey: DATABASE_STATS_KEY,
    queryFn: fetchDatabaseStats,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to fetch system information
 */
export function useSystemInfo() {
  return useQuery({
    queryKey: SYSTEM_INFO_KEY,
    queryFn: fetchSystemInfo,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

/**
 * Hook to export data (only fetches when explicitly requested)
 */
export function useExportData() {
  return useQuery({
    queryKey: EXPORT_KEY,
    queryFn: fetchExportData,
    enabled: false, // Only fetch when explicitly requested via refetch()
  });
}
