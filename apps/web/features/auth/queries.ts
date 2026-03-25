import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { fetchMe } from './api';
import { userKeys } from './keys';

/**
 * Fetch the current authenticated user's profile from the user-service.
 * Only enabled when Clerk confirms the user is signed in.
 */
export function useMe() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
    enabled: isSignedIn === true,
    staleTime: 1000 * 60 * 10, // 10 min — profile doesn't change frequently
    retry: (failureCount, error) => {
      // Don't retry 404 (profile not synced yet from webhook) — just show fallback UI
      if (error instanceof Error && error.message.includes('404')) return false;
      return failureCount < 2;
    },
  });
}
