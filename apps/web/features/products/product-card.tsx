'use client';
import type { Product } from '@/types/api';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive rounded-full">
        Out of Stock
      </span>
    );
  }
  if (qty <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 rounded-full">
        Low Stock
      </span>
    );
  }
  return null;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const inStock = product.stockQuantity > 0;
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product);
    onAddToCart?.(product);
  };

  return (
    <div className="group relative flex flex-col bg-transparent transition-all duration-300">
      {/* Image container */}
      <div className="relative aspect-[4/5] bg-muted/40 rounded-2xl overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Quick Add Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-background/95 backdrop-blur-md text-foreground rounded-xl shadow-lg hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {inStock ? 'Quick Add' : 'Unavailable'}
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <StockBadge qty={product.stockQuantity} />
        </div>
      </div>

      <div className="flex flex-col flex-1 px-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            {/* Category */}
            {product.category && (
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1 block">
                {product.category.name}
              </span>
            )}
            {/* Name */}
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
          <span className="text-sm font-bold text-foreground shrink-0">
            ${Number(product.price).toFixed(2)}
          </span>
        </div>
        
        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}
