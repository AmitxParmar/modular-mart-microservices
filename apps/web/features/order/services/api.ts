import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Order, ShippingAddressSnapshot } from '@/types/api';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddressId?: string;
  shippingAddressSnapshot?: ShippingAddressSnapshot;
}

export interface OrderStatusHistory {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
}

export interface OrderWithHistory extends Order {
  history: OrderStatusHistory[];
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

export async function fetchSellerOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>(ENDPOINTS.SELLER_ORDERS);
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<Order> {
  const { data } = await api.patch<Order>(ENDPOINTS.SELLER_ORDER_STATUS(id), {
    status,
    reason,
  });
  return data;
}

export async function fetchOrderTracking(id: string): Promise<OrderWithHistory> {
  const { data } = await api.get<OrderWithHistory>(ENDPOINTS.ORDER_TRACKING(id));
  return data;
}
