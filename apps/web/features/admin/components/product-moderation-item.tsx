"use client";

import { Button } from "@/components/ui/button";
import { Product, ProductStatus } from "@/types/api";
import { Check, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface ProductModerationItemProps {
  product: Product;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
}

export const ProductModerationItem = memo(function ProductModerationItem({
  product,
  onApprove,
  onReject,
  disabled
}: ProductModerationItemProps) {
  const isApproved = product.status === ProductStatus.APPROVED;
  const isRejected = product.status === ProductStatus.REJECTED;

  return (
    <div 
      className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all"
    >
      <div 
        className="w-full md:size-32 bg-muted rounded-lg shrink-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <Package className="size-8 text-muted-foreground/40" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate" title={product.name}>{product.name}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                isApproved ? "bg-emerald-500/10 text-emerald-500" :
                isRejected ? "bg-destructive/10 text-destructive" :
                "bg-amber-500/10 text-amber-500"
              )}>
                {product.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description || "No description provided."}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-bold text-foreground" aria-label={`Price: $${Number(product?.price).toFixed(2)}`}>
                ${Number(product?.price).toFixed(2)}
              </span>
              <span>Stock: {product.stockQuantity}</span>
              <span>Category: {product.category?.name || "Uncategorized"}</span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isApproved && (
              <Button 
                size="sm" 
                variant="outline" 
                className="size-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                onClick={() => onApprove(product.id)}
                disabled={disabled}
                aria-label={`Approve ${product.name}`}
                title="Approve"
              >
                <Check className="size-4" aria-hidden="true" />
              </Button>
            )}
            {!isRejected && (
              <Button 
                size="sm" 
                variant="outline" 
                className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onReject(product.id)}
                disabled={disabled}
                aria-label={`Reject ${product.name}`}
                title="Reject"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
