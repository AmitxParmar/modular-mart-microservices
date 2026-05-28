import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Product, Order, OrderStatus } from '@/types/api';

/** Fetches products belonging to the currently authenticated seller. */
export async function fetchSellerProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>(ENDPOINTS.SELLER_PRODUCTS);
  return data;
}

/** Fetches performance stats for the seller (e.g. revenue, order counts). */
export async function fetchSellerStats(): Promise<any> {
  const { data } = await api.get<any>(ENDPOINTS.SELLER_STATS);
  return data;
}

/** Fetches all orders assigned to this seller. */
export async function fetchSellerOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>(ENDPOINTS.SELLER_ORDERS);
  return data;
}

/** Creates a new product. Initial status is usually PENDING. */
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data } = await api.post<Product>(ENDPOINTS.PRODUCTS, payload);
  return data;
}

/** Updates the status of a specific order assigned to the seller. */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
): Promise<Order> {
  const { data } = await api.patch<Order>(ENDPOINTS.SELLER_ORDER_STATUS(id), {
    status,
    reason,
  });
  return data;
}
