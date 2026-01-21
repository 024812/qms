'use client';

/**
 * Quilts Hooks - REST API + React Query
 *
 * Refactored from tRPC to use fetch + React Query.
 * Maintains the same interface and functionality.
 *
 * Requirements: 1.2, 1.3 - REST API migration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Quilt,
  QuiltSearchInput,
  CreateQuiltInput,
  UpdateQuiltInput,
} from '@/lib/validations/quilt';

// Query keys for cache management
const QUILTS_KEY = ['quilts'] as const;
const USAGE_KEY = ['usage'] as const;
const DASHBOARD_KEY = ['dashboard'] as const;

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    hasMore?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface QuiltsData {
  quilts: Quilt[];
}

interface QuiltsResponse {
  quilts: Quilt[];
  total: number;
  hasMore: boolean;
}

// Helper function to build query string from search params
function buildQueryString(searchParams?: QuiltSearchInput): string {
  if (!searchParams) return '';

  const params = new URLSearchParams();

  // Add filters
  if (searchParams.filters) {
    if (searchParams.filters.season) params.set('season', searchParams.filters.season);
    if (searchParams.filters.status) params.set('status', searchParams.filters.status);
    if (searchParams.filters.location) params.set('location', searchParams.filters.location);
    if (searchParams.filters.brand) params.set('brand', searchParams.filters.brand);
    if (searchParams.filters.search) params.set('search', searchParams.filters.search);
  }

  // Add pagination
  if (searchParams.skip !== undefined) params.set('offset', String(searchParams.skip));
  if (searchParams.take !== undefined) params.set('limit', String(searchParams.take));

  // Add sorting
  if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
  if (searchParams.sortOrder) params.set('sortOrder', searchParams.sortOrder);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// Fetch functions
async function fetchQuilts(searchParams?: QuiltSearchInput): Promise<QuiltsResponse> {
  const queryString = buildQueryString(searchParams);
  const response = await fetch(`/api/quilts${queryString}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取被子列表失败' }));
    throw new Error(error.error?.message || error.error || '获取被子列表失败');
  }

  const result: ApiResponse<QuiltsData> = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return {
      quilts: result.data.quilts || [],
      total: result.meta?.total || 0,
      hasMore: result.meta?.hasMore || false,
    };
  }

  // Fallback for old format (backward compatibility)
  return result as unknown as QuiltsResponse;
}

async function fetchQuiltById(id: string): Promise<Quilt> {
  const response = await fetch(`/api/quilts/${id}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '获取被子详情失败' }));
    throw new Error(error.error?.message || error.error || '获取被子详情失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.quilt || result.data;
  }

  return result;
}

async function createQuilt(data: CreateQuiltInput): Promise<Quilt> {
  const response = await fetch('/api/quilts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '创建被子失败' }));
    throw new Error(error.error?.message || error.error || '创建被子失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.quilt || result.data;
  }

  return result;
}

async function updateQuilt(data: UpdateQuiltInput): Promise<Quilt> {
  const { id, ...updateData } = data;
  const response = await fetch(`/api/quilts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '更新被子失败' }));
    throw new Error(error.error?.message || error.error || '更新被子失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success && result.data) {
    return result.data.quilt || result.data;
  }

  return result;
}

async function deleteQuilt(input: { id: string }): Promise<{ success: boolean }> {
  const response = await fetch(`/api/quilts/${input.id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '删除被子失败' }));
    throw new Error(error.error?.message || error.error || '删除被子失败');
  }

  const result = await response.json();

  // Handle new unified API response format
  if (result.success !== undefined) {
    return { success: result.success };
  }

  return result;
}

// Usage tracking API functions
// These match the original tRPC interface for backward compatibility
interface StartUsageInput {
  quiltId: string;
  startDate: Date;
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string;
}

interface EndUsageInput {
  quiltId: string;
  endDate?: Date;
  notes?: string;
}

interface UpdateQuiltStatusInput {
  quiltId: string;
  status: 'IN_USE' | 'STORAGE' | 'MAINTENANCE';
  usageType?: 'REGULAR' | 'GUEST' | 'SPECIAL_OCCASION' | 'SEASONAL_ROTATION';
  notes?: string;
}

interface UsageRecord {
  id: string;
  quiltId: string;
  startDate: Date;
  endDate: Date | null;
  usageType: string;
  notes: string | null;
}

async function startUsage(data: StartUsageInput): Promise<UsageRecord> {
  // Update the quilt status to IN_USE (which will automatically create the usage record atomically)
  const response = await fetch(`/api/quilts/${data.quiltId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'IN_USE',
      usageType: data.usageType || 'REGULAR',
      notes: data.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '开始使用失败' }));
    throw new Error(error.error || '开始使用失败');
  }

  const result = await response.json();
  return result.usageRecord;
}

async function endUsage(data: EndUsageInput): Promise<UsageRecord | null> {
  // Update the quilt status to STORAGE (which will end the usage record)
  const response = await fetch(`/api/quilts/${data.quiltId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'STORAGE',
      notes: data.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '结束使用失败' }));
    throw new Error(error.error || '结束使用失败');
  }

  const result = await response.json();
  return result.usageRecord;
}

async function updateQuiltStatus(data: UpdateQuiltStatusInput): Promise<{
  quilt: { id: string; currentStatus: string };
  usageRecord?: UsageRecord;
}> {
  const response = await fetch(`/api/quilts/${data.quiltId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: data.status,
      usageType: data.usageType,
      notes: data.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '更新状态失败' }));
    throw new Error(error.error || '更新状态失败');
  }

  return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all quilts with optional search/filter parameters
 */
export function useQuilts(searchParams?: QuiltSearchInput) {
  return useQuery({
    queryKey: [...QUILTS_KEY, searchParams],
    queryFn: () => fetchQuilts(searchParams),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch a single quilt by ID
 */
export function useQuilt(id: string) {
  return useQuery({
    queryKey: [...QUILTS_KEY, id],
    queryFn: () => fetchQuiltById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new quilt
 */
export function useCreateQuilt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuilt,
    onSuccess: () => {
      // Invalidate quilt queries
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });

      // Invalidate dashboard
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Hook to update an existing quilt with optimistic updates
 */
export function useUpdateQuilt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuilt,
    // Optimistic update - immediately update UI before server response
    onMutate: async newQuilt => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: QUILTS_KEY });

      // Snapshot current value for rollback
      const previousData = queryClient.getQueryData<QuiltsResponse>(QUILTS_KEY);

      // Optimistically update the cache
      queryClient.setQueryData<QuiltsResponse>(QUILTS_KEY, old => {
        if (!old) return old;
        return {
          ...old,
          quilts: old.quilts.map(q => (q.id === newQuilt.id ? { ...q, ...newQuilt } : q)),
        };
      });

      return { previousData };
    },
    // Rollback on error
    onError: (_err, _newQuilt, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUILTS_KEY, context.previousData);
      }
    },
    // Refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Hook to delete a quilt with optimistic updates
 */
export function useDeleteQuilt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuilt,
    // Optimistic update - immediately remove from UI
    onMutate: async deletedQuilt => {
      await queryClient.cancelQueries({ queryKey: QUILTS_KEY });

      const previousData = queryClient.getQueryData<QuiltsResponse>(QUILTS_KEY);

      // Optimistically remove the quilt from cache
      queryClient.setQueryData<QuiltsResponse>(QUILTS_KEY, old => {
        if (!old) return old;
        return {
          ...old,
          quilts: old.quilts.filter(q => q.id !== deletedQuilt.id),
          total: old.total - 1,
        };
      });

      return { previousData };
    },
    onError: (_err, _deletedQuilt, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUILTS_KEY, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Hook to start using a quilt (creates usage record and updates status to IN_USE)
 */
export function useStartUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Hook to end using a quilt (ends usage record and updates status to STORAGE)
 */
export function useEndUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}

/**
 * Hook to update a quilt's status with automatic usage record management
 */
export function useUpdateQuiltStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuiltStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUILTS_KEY });
      queryClient.invalidateQueries({ queryKey: USAGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
  });
}
