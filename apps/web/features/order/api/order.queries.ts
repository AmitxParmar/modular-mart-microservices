import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { fetchOrders, fetchOrder } from '../services/api';
import { orderKeys } from './keys';

/**
 * Fetch all orders for the current user.
 * Only enabled when the user is authenticated — prevents 401s on page load.
 */
export function useOrders() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
    enabled: isSignedIn === true, // stable: only true/false, never undefined after mount
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/**
 * Suspense-enabled version of useOrders.
 * To be used with React Suspense and error boundaries.
 */
export function useSuspenseOrders() {
  return useSuspenseQuery({
    queryKey: orderKeys.lists(),
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 2,
  });
}

/** Fetch a single order. Requires an authenticated user and a valid ID. */
export function useOrder(id: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrder(id),
    enabled: isSignedIn === true && Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}
