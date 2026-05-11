'use client';

import { useProducts } from './queries';
import { ProductGrid } from './product-grid';

export function ProductsSection() {
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useProducts({ limit: 8 });

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load products. Make sure the catalog service is running.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {products.length} products from the catalog.
        </p>
      </div>
      <ProductGrid 
        products={products} 
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </section>
  );
}
