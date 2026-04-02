'use client';

/**
 * Settings hooks backed by server actions.
 *
 * This keeps the React Query-facing API stable for client components while
 * removing internal settings reads and writes from `/api/settings/**`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  changePasswordAction,
  getAppSettingsAction,
  getDatabaseStatsAction,
  getExportDataAction,
  getSystemInfoAction,
  updateAppSettingsAction,
} from '@/app/actions/settings';
import type {
  AppSettings,
  ChangePasswordInput,
  DatabaseStats,
  ExportData,
  SystemInfo,
  UpdateAppSettingsInput,
} from '@/lib/types/settings';

const SETTINGS_KEY = ['settings'] as const;
const DATABASE_STATS_KEY = ['database-stats'] as const;
const SYSTEM_INFO_KEY = ['system-info'] as const;
const EXPORT_KEY = ['export'] as const;

function unwrapActionResult<T>(
  result:
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        error: {
          message: string;
        };
      }
): T {
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function useAppSettings(options?: { initialData?: AppSettings }) {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => unwrapActionResult(await getAppSettingsAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 60000,
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAppSettingsInput) =>
      unwrapActionResult(await updateAppSettingsAction(data)),
    onMutate: async newSettings => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_KEY });

      const previousSettings = queryClient.getQueryData<AppSettings>(SETTINGS_KEY);

      queryClient.setQueryData<AppSettings>(SETTINGS_KEY, old => {
        if (!old) {
          return old;
        }

        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (_error, _newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(SETTINGS_KEY, context.previousSettings);
      }
    },
    onSuccess: settings => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SETTINGS_KEY }),
        queryClient.invalidateQueries({ queryKey: DATABASE_STATS_KEY }),
        queryClient.invalidateQueries({ queryKey: SYSTEM_INFO_KEY }),
      ]);
    },
  });
}

export function useDatabaseStats(options?: { initialData?: DatabaseStats }) {
  return useQuery({
    queryKey: DATABASE_STATS_KEY,
    queryFn: async () => unwrapActionResult(await getDatabaseStatsAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useSystemInfo(options?: { initialData?: SystemInfo }) {
  return useQuery({
    queryKey: SYSTEM_INFO_KEY,
    queryFn: async () => unwrapActionResult(await getSystemInfoAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 300000,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) =>
      unwrapActionResult(await changePasswordAction(data)),
  });
}

export function useExportData(options?: { initialData?: ExportData }) {
  return useQuery({
    queryKey: EXPORT_KEY,
    queryFn: async () => unwrapActionResult(await getExportDataAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    enabled: false,
  });
}
