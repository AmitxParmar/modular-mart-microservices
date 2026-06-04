"use client";

import { Product, ProductStatus } from "@/types/api";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface ProductListItemProps {
  product: Product;
  actions?: React.ReactNode;
}

export function ProductListItem({ product, actions }: Readonly<ProductListItemProps>) {
  const statusConfig = {
    [ProductStatus.APPROVED]: "bg-emerald-500/10 text-emerald-500",
    [ProductStatus.REJECTED]: "bg-destructive/10 text-destructive",
  };

  const statusClassName = statusConfig[product.status as keyof typeof statusConfig] ?? "bg-amber-500/10 text-amber-500";

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all">
      <div className="w-full md:size- bg-muted rounded-lg shrink-0 flex items-center justify-center">
        <Package className="size- text-muted-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold truncate">{product.name}</h3>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  statusClassName
                )}
              >
                {product.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {product.description || "No description provided."}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                ${Number(product?.price).toFixed(2)}
              </span>
              <span>Stock: {product.stockQuantity}</span>
              <span>Category: {product.category?.name || "Uncategorized"}</span>
            </div>
          </div>

          {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
