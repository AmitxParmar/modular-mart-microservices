'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ClerkTokenSync } from '@/components/clerk-token-sync';

/**
 * Wraps the app with TanStack Query and wires the Clerk token into the Axios client.
 * Using useState ensures each browser session gets its own QueryClient instance.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 min global default
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkTokenSync />
      {children}
    </QueryClientProvider>
  );
}
