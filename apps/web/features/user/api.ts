import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Address, Order } from '@/types/api';

export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await api.get<Address[]>(ENDPOINTS.ADDRESSES);
  return data;
}

export async function createAddress(address: Partial<Address>): Promise<Address> {
  const { data } = await api.post<Address>(ENDPOINTS.ADDRESSES, address);
  return data;
}

export async function updateAddress(id: string, address: Partial<Address>): Promise<Address> {
  const { data } = await api.patch<Address>(ENDPOINTS.ADDRESS(id), address);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(ENDPOINTS.ADDRESS(id));
}

export async function setDefaultAddress(id: string): Promise<void> {
  await api.put(ENDPOINTS.ADDRESS_DEFAULT(id));
}

export async function fetchUserOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>(ENDPOINTS.USER_ORDERS);
  return data;
}
