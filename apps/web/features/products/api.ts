import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Product, Category } from '@/types/api';

export async function fetchProducts(filters?: { categoryId?: string }): Promise<Product[]> {
  const { data } = await api.get<Product[]>(ENDPOINTS.PRODUCTS, { params: filters });
  return data;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const { data } = await api.get<Product>(ENDPOINTS.PRODUCT(slug));
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>(ENDPOINTS.CATEGORIES);
  return data;
}

export async function createProduct(
  payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Product> {
  const { data } = await api.post<Product>(ENDPOINTS.PRODUCTS, payload);
  return data;
}
