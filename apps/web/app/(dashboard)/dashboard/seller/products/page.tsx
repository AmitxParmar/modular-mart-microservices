"use client";

import { useSellerProducts } from "@/features/seller/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductStatus } from "@/types/api";
import { Package, PlusCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SellerProductsPage() {
  const { data: products, isLoading } = useSellerProducts();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage and track your listed products.</p>
        </div>
        <Link 
          href="/dashboard/seller/products/new"
          className={cn(buttonVariants({ variant: "default" }), "rounded-full gap-2")}
        >
          <PlusCircle className="size-4" />
          Add Product
        </Link>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Product List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : !products || products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/40 rounded-xl">
                <Package className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">You haven't added any products yet.</p>
                <Link 
                  href="/dashboard/seller/products/new"
                  className={cn(buttonVariants({ variant: "link" }), "mt-2")}
                >
                  Create your first product
                </Link>
              </div>
            ) : (
              products.map((product) => (
                <div 
                  key={product.id}
                  className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all"
                >
                  <div className="w-full md:size-32 bg-muted rounded-lg shrink-0 flex items-center justify-center">
                    <Package className="size-8 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate">{product.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            product.status === ProductStatus.APPROVED ? "bg-emerald-500/10 text-emerald-500" :
                            product.status === ProductStatus.REJECTED ? "bg-destructive/10 text-destructive" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {product.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.description || "No description provided."}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">${Number(product?.price).toFixed(2)}</span>
                          <span>Stock: {product.stockQuantity}</span>
                          <span>Category: {product.category?.name || "Uncategorized"}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Link 
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "size-8 p-0")}
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
