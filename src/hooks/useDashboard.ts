'use client';

/**
 * Dashboard hooks backed by server actions.
 *
 * This keeps the client hook contract stable while removing internal reads
 * from `/api/dashboard`.
 */

import { useQuery } from '@tanstack/react-query';

import { getDashboardStatsAction } from '@/app/actions/dashboard';
import type { DashboardStatsView } from '@/lib/types/dashboard';

const DASHBOARD_KEY = ['dashboard'] as const;

interface DashboardStatsInput {
  dateRange?: {
    start: Date;
    end: Date;
  };
  initialData?: DashboardStatsView;
}

export function useDashboardStats(options?: DashboardStatsInput) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, options?.dateRange ?? null],
    queryFn: async () => {
      const result = await getDashboardStatsAction();

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRealtimeDashboard() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  return { stats, isLoading, error, refetch };
}
