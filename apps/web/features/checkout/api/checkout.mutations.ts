import { useMutation } from "@tanstack/react-query";
import { checkoutService, CreateOrderRequest } from "../services/checkout.api";

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: ({
      data,
      options,
    }: {
      data: CreateOrderRequest;
      options?: { skipTokenCache?: boolean };
    }) => checkoutService.createOrder(data, options),
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount: number }) =>
      checkoutService.createPaymentIntent(orderId, amount),
  });
};
