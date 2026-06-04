import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SellerProductOverviewProps {
  products: any[] | undefined;
  isLoading: boolean;
}

/**
 * Component for displaying a high-level overview of the seller's inventory.
 */
export function SellerProductOverview({ products, isLoading }: SellerProductOverviewProps) {
  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">
          Product Overview
        </CardTitle>
        <Link 
          href="/dashboard/seller/products"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-primary")}
        >
          Inventory <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : !products || products.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No products listed.</p>
          ) : (
            products.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-muted rounded overflow-hidden">
                    <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/30" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.stockQuantity} in stock
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${Number(product.price).toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    product.status === 'APPROVED' ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {product.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
