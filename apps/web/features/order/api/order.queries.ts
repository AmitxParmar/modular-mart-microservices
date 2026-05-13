import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  fetchOrders,
  fetchOrder,
  fetchSellerOrders,
  fetchOrderTracking,
} from '../services/api';
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

/** Fetch all orders for the current seller. */
export function useSellerOrders() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: orderKeys.sellerLists(),
    queryFn: fetchSellerOrders,
    enabled: isSignedIn === true,
    staleTime: 1000 * 60 * 2,
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

/** Fetch order tracking information with history. */
export function useOrderTracking(id: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: orderKeys.tracking(id),
    queryFn: () => fetchOrderTracking(id),
    enabled: isSignedIn === true && Boolean(id),
    staleTime: 1000 * 60 * 1, // 1 min for tracking
  });
}
