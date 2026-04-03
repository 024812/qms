'use client';

import { useQuery } from '@tanstack/react-query';

import { getCardsAction } from '@/app/actions/cards';
import type { GetCardsActionInput, GetCardsActionResult } from '@/app/actions/cards.types';
import { cardsQueryKeys } from '@/modules/cards/blueprint';

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

function toCardsQueryParams(input: GetCardsActionInput): Record<string, unknown> {
  return {
    ...(input.search !== undefined ? { search: input.search } : {}),
    ...(input.filter !== undefined ? { filter: input.filter } : {}),
    ...(input.includeSold !== undefined ? { includeSold: input.includeSold } : {}),
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.pageSize !== undefined ? { pageSize: input.pageSize } : {}),
  };
}

export function useCards(
  input: GetCardsActionInput,
  options?: { initialData?: GetCardsActionResult }
) {
  return useQuery({
    queryKey: cardsQueryKeys.list(toCardsQueryParams(input)),
    queryFn: async () => unwrapActionResult(await getCardsAction(input)),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    placeholderData: previousData => previousData,
    staleTime: 60000,
  });
}
