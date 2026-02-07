'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CARD_SETTINGS_KEY = ['card-settings'] as const;

export interface CardSettings {
  azureOpenAIApiKey: string;
  azureOpenAIEndpoint: string;
  azureOpenAIDeployment: string;
  ebayAppId?: string;
  ebayCertId?: string;
  ebayDevId?: string;
  rapidApiKey?: string;
  balldontlieApiKey?: string;
}

export interface UpdateCardSettingsInput {
  azureOpenAIApiKey?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIDeployment?: string;
  ebayAppId?: string;
  ebayCertId?: string;
  ebayDevId?: string;
  rapidApiKey?: string;
  balldontlieApiKey?: string;
}

async function fetchCardSettings(): Promise<CardSettings> {
  const response = await fetch('/api/cards/settings');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch card settings' }));
    throw new Error(error.error?.message || error.error || 'Failed to fetch card settings');
  }

  const result = await response.json();
  return result.data.settings;
}

async function updateCardSettings(data: UpdateCardSettingsInput) {
  const response = await fetch('/api/cards/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update card settings' }));
    throw new Error(error.error?.message || error.error || 'Failed to update card settings');
  }

  return response.json();
}

export function useCardSettings() {
  return useQuery({
    queryKey: CARD_SETTINGS_KEY,
    queryFn: fetchCardSettings,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}

export function useUpdateCardSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCardSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CARD_SETTINGS_KEY });
    },
  });
}
