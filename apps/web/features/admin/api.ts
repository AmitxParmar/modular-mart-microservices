import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { AdminStats, ServiceHealthLog, UserManagementItem, Product } from '@/types/api';

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>(ENDPOINTS.ADMIN_STATS);
  return data;
}

export async function fetchServiceHealth(): Promise<ServiceHealthLog[]> {
  const { data } = await api.get<ServiceHealthLog[]>(ENDPOINTS.ADMIN_HEALTH);
  return data;
}

export async function fetchAdminUsers(): Promise<UserManagementItem[]> {
  const { data } = await api.get<UserManagementItem[]>(ENDPOINTS.ADMIN_USERS);
  return data;
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>(ENDPOINTS.ADMIN_PRODUCTS);
  return data;
}

export async function approveProduct(id: string): Promise<void> {
  await api.post(ENDPOINTS.ADMIN_PRODUCT_APPROVE(id));
}

export async function rejectProduct(id: string): Promise<void> {
  await api.post(ENDPOINTS.ADMIN_PRODUCT_REJECT(id));
}
