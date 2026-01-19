'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Initialize Zod with Chinese error messages for client-side validation
import '@/lib/validations/init';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes (data is considered fresh)
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 10 minutes before garbage collection
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Disable refetch on window focus for better performance
            refetchOnWindowFocus: false,
            // Refetch on reconnect for data consistency
            refetchOnReconnect: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
