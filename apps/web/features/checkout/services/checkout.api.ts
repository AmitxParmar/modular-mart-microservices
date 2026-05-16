import { api } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import type { ShippingAddressSnapshot } from "@/types/api";

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  /** Optional logical reference to a saved address in user-service */
  shippingAddressId?: string;
  /** Full address snapshot captured by the frontend at checkout time */
  shippingAddressSnapshot?: ShippingAddressSnapshot;
  /** Internal ID fallback if JWT is stale */
  userId?: string;
}

export const checkoutService = {
  createOrder: async (data: CreateOrderRequest, options?: { skipTokenCache?: boolean }) => {
    const response = await api.post(ENDPOINTS.CREATE_ORDER, data, options as any);
    return response.data;
  },

  createPaymentIntent: async (orderId: string, amount: number) => {
    const response = await api.post(ENDPOINTS.CREATE_INTENT, { orderId, amount });
    return response.data;
  },
};
