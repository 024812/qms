'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCardSettingsAction, updateCardSettingsAction } from '@/app/actions/cards';
import type { CardSettings, UpdateCardSettingsInput } from '@/app/actions/cards.types';

const CARD_SETTINGS_KEY = ['card-settings'] as const;

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

export type { CardSettings, UpdateCardSettingsInput };

export function useCardSettings(options?: { initialData?: CardSettings; enabled?: boolean }) {
  return useQuery({
    queryKey: CARD_SETTINGS_KEY,
    queryFn: async () => unwrapActionResult(await getCardSettingsAction()),
    ...(options?.initialData ? { initialData: options.initialData } : {}),
    enabled: options?.enabled ?? true,
    staleTime: 60000,
    retry: 1,
  });
}

export function useUpdateCardSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCardSettingsInput) =>
      unwrapActionResult(await updateCardSettingsAction(data)),
    onSuccess: settings => {
      queryClient.setQueryData(CARD_SETTINGS_KEY, settings);
      queryClient.invalidateQueries({ queryKey: CARD_SETTINGS_KEY });
    },
  });
}
