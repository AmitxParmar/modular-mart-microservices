import { api } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddressId?: string;
}

export const checkoutService = {
  createOrder: async (data: CreateOrderRequest) => {
    const response = await api.post(ENDPOINTS.CREATE_ORDER, data);
    return response.data;
  },

  createPaymentIntent: async (orderId: string) => {
    const response = await api.post(ENDPOINTS.CREATE_INTENT, { orderId });
    return response.data;
  },
};
