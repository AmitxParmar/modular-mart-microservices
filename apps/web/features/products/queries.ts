import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct, fetchCategories } from './api';
import { productKeys } from './keys';
import type { ProductFilters } from '@/types/api';

export function useProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam }) => fetchProducts({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // Categories change rarely
  });
}
