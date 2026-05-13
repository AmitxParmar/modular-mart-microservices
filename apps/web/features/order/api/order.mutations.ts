import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrder,
  updateOrderStatus,
  type CreateOrderPayload,
} from '../services/api';
import { orderKeys } from './keys';

/**
 * Create a new order.
 * Optimistic: we immediately add the new order to the cache,
 * then refetch on settle to confirm the real server state.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),

    onSuccess: () => {
      // Invalidate the list so the user sees the new order immediately
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Update an order status (Seller action).
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => updateOrderStatus(id, status, reason),

    onSuccess: (_, variables) => {
      // Invalidate both lists and specific detail
      queryClient.invalidateQueries({ queryKey: orderKeys.sellerLists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        queryKey: orderKeys.tracking(variables.id),
      });
    },
  });
}
