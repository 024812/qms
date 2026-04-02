'use client';

/**
 * Usage hooks backed by server actions.
 *
 * This keeps the existing React Query-facing API stable for client
 * components while removing internal reads and writes from `/api/usage/**`.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createUsageRecordAction,
  deleteUsageRecordAction,
  endUsageRecordAction,
  getActiveUsageRecordAction,
  getAllActiveUsageRecordsAction,
  getOverallUsageStatsAction,
  getQuiltUsageRecordsAction,
  getUsageRecordAction,
  getUsageRecordsAction,
  getUsageStatsAction,
  updateUsageRecordAction,
} from '@/app/actions/usage';

const USAGE_KEY = ['usage'] as const;
const QUILTS_KEY = ['quilts'] as const;
const DASHBOARD_KEY = ['dashboard'] as const;

export interface UsageRecord {
  id: string;
  quiltId: string;
  startDate: Date;
  endDate: Date | null;
  usageType: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecordWithQuilt {
  id: string;
  quiltId: string;
  quiltName: string | null;
  itemNumber: number | null;
  color: string | null;
  season: string | null;
  currentStatus: string | null;
  startedAt: Date;
  endedAt: Date | null;
  usageType: string | null;
  notes: string | null;
  isActive: boolean;
  duration: number | null;
}

export interface UsageStats {
  totalUsages: number;
  totalDays: number;
  averageDays: number;
  lastUsedDate: Date | null;
}

export interface OverallUsageStats {
  total: number;
  active: number;
  completed: number;
}

export interface CreateUsageRecordInput {
  quiltId: string;
  startDate: Date;
  endDate?: Date | null;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string | null;
}

export interface UpdateUsageRecordInput {
  id: string;
  startDate?: Date;
  endDate?: Date | null;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string | null;
}

export interface EndUsageRecordInput {
  quiltId: string;
  endDate: Date;
  notes?: string | null;
}

interface UsageFilters {
  quiltId?: string;
  limit?: number;
  offset?: number;
}

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

export function useUsageRecords(filters?: UsageFilters) {
  return useQuery({
    queryKey: [...USAGE_KEY, 'list', filters],
    queryFn: async () => {
      const result = await getUsageRecordsAction(filters);
      return unwrapActionResult(result).records;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useUsageRecord(id: string) {
  return useQuery({
    queryKey: [...USAGE_KEY, 'detail', id],
    queryFn: async () => {
      const result = await getUsageRecordAction(id);
      const record = unwrapActionResult(result);

      if (!record) {
        throw new Error('Usage record not found');
      }

      return record;
    },
    enabled: !!id,
  });
}

export function useQuiltUsageRecords(quiltId: string) {
  return useQuery({
    queryKey: [...USAGE_KEY, 'by-quilt', quiltId],
    queryFn: async () => {
      const result = await getQuiltUsageRecordsAction(quiltId);
      return unwrapActionResult(result).records;
    },
    enabled: !!quiltId,
  });
}

export function useActiveUsageRecord(quiltId: string) {
  return useQuery({
    queryKey: [...USAGE_KEY, 'active', quiltId],
    queryFn: async () => {
      const result = await getActiveUsageRecordAction(quiltId);
      return unwrapActionResult(result);
    },
    enabled: !!quiltId,
  });
}

export function useAllActiveUsageRecords() {
  return useQuery({
    queryKey: [...USAGE_KEY, 'all-active'],
    queryFn: async () => {
      const result = await getAllActiveUsageRecordsAction();
      return unwrapActionResult(result).records;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateUsageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUsageRecordInput) =>
      unwrapActionResult(await createUsageRecordAction(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUpdateUsageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUsageRecordInput) =>
      unwrapActionResult(await updateUsageRecordAction(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useEndUsageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EndUsageRecordInput) =>
      unwrapActionResult(await endUsageRecordAction(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useDeleteUsageRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const result = await deleteUsageRecordAction(input.id);
      const data = unwrapActionResult(result);

      return { success: data.deleted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

export function useUsageStats(quiltId: string) {
  return useQuery({
    queryKey: [...USAGE_KEY, 'stats', quiltId],
    queryFn: async () => {
      const result = await getUsageStatsAction(quiltId);
      return unwrapActionResult(result);
    },
    enabled: !!quiltId,
  });
}

export function useOverallUsageStats() {
  return useQuery({
    queryKey: [...USAGE_KEY, 'overall-stats'],
    queryFn: async () => {
      const result = await getOverallUsageStatsAction();
      return unwrapActionResult(result);
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}
