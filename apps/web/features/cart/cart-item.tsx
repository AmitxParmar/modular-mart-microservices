'use client';

import { useCart } from '@/hooks/use-cart';
import type { Product } from '@/types/api';
import { Trash } from 'lucide-react';

interface CartItemProps {
  product: Product;
  quantity: number;
}

export function CartItem({ product, quantity }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      {/* Image placeholder */}
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
        <div className="text-muted-foreground/30">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">{product.name}</h4>
        <div className="text-sm text-muted-foreground">${Number(product.price).toFixed(2)}</div>
        
        <div className="flex items-center gap-2 mt-2">
          <select 
            value={quantity}
            onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                Qty: {num}
              </option>
            ))}
          </select>
          <button
            onClick={() => removeItem(product.id)}
            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
            title="Remove item"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
