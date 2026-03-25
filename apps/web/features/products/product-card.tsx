import type { Product } from '@/types/api';
import { ShoppingCart, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
        Out of Stock
      </span>
    );
  }
  if (qty <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
        Low Stock ({qty} left)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
      In Stock
    </span>
  );
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const inStock = product.stockQuantity > 0;

  return (
    <div className="group flex flex-col bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Image placeholder */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        <div className="w-16 h-16 text-muted-foreground/30">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Category */}
        {product.category && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="w-3 h-3" />
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 mt-auto">
          <StockBadge qty={product.stockQuantity} />
          <span className="text-lg font-bold text-foreground">
            ${Number(product.price).toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => onAddToCart?.(product)}
          disabled={!inStock}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          {inStock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}
