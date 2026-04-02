'use client';

import { useQuery } from '@tanstack/react-query';

import { getCardsAction } from '@/app/actions/cards';
import type { GetCardsActionInput, GetCardsActionResult } from '@/app/actions/cards.types';

const CARDS_KEY = ['cards'] as const;

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

export function useCards(
  input: GetCardsActionInput,
  options?: { initialData?: GetCardsActionResult }
) {
  return useQuery({
    queryKey: [...CARDS_KEY, input],
    queryFn: async () => unwrapActionResult(await getCardsAction(input)),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    placeholderData: previousData => previousData,
    staleTime: 60000,
  });
}
