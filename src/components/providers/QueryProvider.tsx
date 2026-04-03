'use client';

import {
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import '@/lib/validations/init';

interface ApiError extends Error {
  status?: number;
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof Error;
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: error => {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          return;
        }

        toast.error('请求失败', { description: error.message });
      },
    }),
    mutationCache: new MutationCache({
      onError: error => {
        if (isApiError(error) && (error.status === 401 || error.status === 403)) {
          return;
        }

        toast.error('操作失败', { description: error.message });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          if (isApiError(error) && (error.status === 401 || error.status === 403)) {
            return false;
          }

          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        networkMode: 'online',
      },
      mutations: {
        retry: (failureCount, error) => {
          if (isApiError(error) && (error.status === 401 || error.status === 403)) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    return createQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
