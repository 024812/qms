'use client';

/**
 * Quilts Hooks - internal read hooks backed by server actions.
 *
 * This removes internal reads from `/api/quilts/**` while keeping the
 * React Query contract stable for existing client components.
 */

import { useQuery } from '@tanstack/react-query';

import { getQuiltAction, getQuiltsAction } from '@/app/actions/quilts';
import type { Quilt, QuiltSearchInput } from '@/lib/validations/quilt';
import { quiltsQueryKeys } from '@/modules/quilts/blueprint';

export interface QuiltsResponse {
  quilts: Quilt[];
  total: number;
  hasMore: boolean;
}

export function useQuilts(
  searchParams?: QuiltSearchInput,
  options?: { initialData?: QuiltsResponse }
) {
  return useQuery({
    queryKey: quiltsQueryKeys.list(searchParams ?? {}),
    queryFn: async () => {
      const result = await getQuiltsAction(searchParams);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    staleTime: 60000,
  });
}

export function useQuilt(id: string) {
  return useQuery({
    queryKey: quiltsQueryKeys.item(id),
    queryFn: async () => {
      const result = await getQuiltAction(id);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    enabled: !!id,
  });
}
