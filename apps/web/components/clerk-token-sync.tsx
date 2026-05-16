'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setTokenGetter } from '@/lib/api-client';

/**
 * Invisible component. Rendered once inside the root layout.
 * Wires the Clerk `getToken` function into the Axios interceptor so every
 * outgoing API request carries the latest JWT automatically.
 */
export function ClerkTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    // Pass a wrapper that forwards the skipCache option to Clerk's getToken
    setTokenGetter((options) => getToken({ skipCache: options?.skipCache }));
  }, [getToken]);

  return null;
}
