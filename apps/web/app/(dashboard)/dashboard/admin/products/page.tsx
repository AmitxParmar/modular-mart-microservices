"use client";

import { useAdminProducts, useApproveProduct, useRejectProduct } from "@/features/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProductStatus } from "@/types/api";
import { Check, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { mutate: approve, isPending: isApproving } = useApproveProduct();
  const { mutate: reject, isPending: isRejecting } = useRejectProduct();

  const handleApprove = (id: string) => {
    if (confirm("Are you sure you want to approve this product?")) {
      approve(id);
    }
  };

  const handleReject = (id: string) => {
    if (confirm("Are you sure you want to reject this product?")) {
      reject(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Moderation</h1>
        <p className="text-muted-foreground mt-1">Review, approve, or reject seller product listings.</p>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))
            ) : products?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border/40 rounded-xl">
                <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No products found for review.</p>
              </div>
            ) : (
              products?.map((product) => (
                <div 
                  key={product.id}
                  className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all"
                >
                  <div className="w-full md:w-32 h-32 bg-muted rounded-lg shrink-0 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/40" />
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
                        {product.status !== ProductStatus.APPROVED && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => handleApprove(product.id)}
                            disabled={isApproving || isRejecting}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {product.status !== ProductStatus.REJECTED && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(product.id)}
                            disabled={isApproving || isRejecting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
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
