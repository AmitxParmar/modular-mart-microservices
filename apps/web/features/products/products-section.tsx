'use client';

import { useProducts } from './queries';
import { ProductGrid } from './product-grid';
import { useFilterState } from './hooks/use-filter-state';
import { FilterToolbar } from './components/filter-toolbar';

export function ProductsSection() {
  const { filters } = useFilterState();
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useProducts({ ...filters, limit: 8 });

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const totalProducts = data?.pages[0]?.metadata?.total ?? products.length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-3/4 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive font-medium bg-destructive/10 p-4 rounded-lg">
        Failed to load products. Make sure the catalog service is running.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {products.length} of {totalProducts} products.
          </p>
        </div>
      </div>
      
      <FilterToolbar />
      
      {products.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <p className="text-muted-foreground font-medium">No products found matching your filters.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or clearing them.</p>
        </div>
      ) : (
        <ProductGrid 
          products={products} 
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}
    </section>
  );
}
