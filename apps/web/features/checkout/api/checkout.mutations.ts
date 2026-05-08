import { useMutation } from "@tanstack/react-query";
import { checkoutService, CreateOrderRequest } from "../services/checkout.api";

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => checkoutService.createOrder(data),
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: (orderId: string) => checkoutService.createPaymentIntent(orderId),
  });
};
