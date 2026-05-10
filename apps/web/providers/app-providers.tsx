'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ClerkTokenSync } from '@/components/clerk-token-sync';
import { RoleSync } from './role-sync';

/**
 * Wraps the app with TanStack Query and wires the Clerk token into the Axios client.
 * Using useState ensures each browser session gets its own QueryClient instance.
 */
export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkTokenSync />
      <RoleSync />
      {children}
    </QueryClientProvider>
  );
}
