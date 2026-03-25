import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { fetchProducts, fetchProduct, fetchCategories } from './api';
import { productKeys } from './keys';

export function useProducts(filters?: { categoryId?: string }) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60 * 5, // 5 min — public data, no need to refetch often
    // Products are public; no auth required
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
