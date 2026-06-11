import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProductFilters } from '@/types/api';

export function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo((): ProductFilters => {
    const params: ProductFilters = {};
    searchParams.forEach((value, key) => {
      if (key === 'minPrice' || key === 'maxPrice' || key === 'rating' || key === 'discount' || key === 'limit') {
        params[key] = Number(value);
      } else if (key === 'inStock') {
        params[key] = value === 'true';
      } else if (key === 'category') {
        params.categorySlug = value;
      } else {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  const setFilter = useCallback(
    (name: string, value: string | number | boolean | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      const key = name === 'categorySlug' ? 'category' : name;

      if (value === undefined || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      params.delete('cursor');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    filters,
    setFilter,
    clearFilters,
  };
}
