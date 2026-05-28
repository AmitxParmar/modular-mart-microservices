import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, updateOrderStatus } from "./api";
import { sellerKeys } from "./keys";
import { orderKeys } from "../order/api/keys";
import type { OrderStatus } from "@/types/api";

/** Create a new product as a seller. */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerKeys.products() });
    },
  });
}

/** Update the status of an order (e.g., mark as SHIPPED). */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) => 
      updateOrderStatus(id, status, reason),
    onSuccess: (_, variables) => {
      // Invalidate both the seller list and specific order details/tracking
      queryClient.invalidateQueries({ queryKey: sellerKeys.orders() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.tracking(variables.id) });
    },
  });
}
