import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, type CreateOrderPayload } from './api';
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
