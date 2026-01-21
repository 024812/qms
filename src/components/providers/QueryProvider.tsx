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
            // Cache data for 5 minutes (data is considered fresh)
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes before garbage collection
            gcTime: 10 * 60 * 1000,
            // Smart retry - don't retry on auth errors
            retry: (failureCount, error) => {
              if (isApiError(error) && (error.status === 401 || error.status === 403)) {
                return false;
              }
              return failureCount < 3;
            },
            // Refetch on window focus for data freshness
            refetchOnWindowFocus: 'always',
            // Refetch on reconnect for data consistency
            refetchOnReconnect: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
            // Network mode for offline support
            networkMode: 'offlineFirst',
          },
          mutations: {
            // Retry failed mutations once (except auth errors)
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
