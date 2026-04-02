'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

// Initialize Zod with Chinese error messages for client-side validation
import '@/lib/validations/init';

// Error type guard for structured errors
interface ApiError extends Error {
  status?: number;
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof Error;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: error => {
            if (isApiError(error)) {
              // Don't show toast for 401/403 - these are handled by auth
              if (error.status === 401 || error.status === 403) return;
            }
            toast.error('请求失败', { description: error.message });
          },
        }),
        mutationCache: new MutationCache({
          onError: error => {
            if (isApiError(error)) {
              if (error.status === 401 || error.status === 403) return;
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
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
