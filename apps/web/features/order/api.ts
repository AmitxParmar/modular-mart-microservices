import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Order, OrderItem } from '@/types/api';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddressId?: string;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>(ENDPOINTS.ORDERS);
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(ENDPOINTS.ORDER(id));
  return data;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>(ENDPOINTS.ORDERS, payload);
  return data;
}
