import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface SellerRecentOrdersProps {
  orders: any[] | undefined;
  isLoading: boolean;
}

/**
 * Component for displaying the seller's most recent orders.
 */
export function SellerRecentOrders({ orders, isLoading }: SellerRecentOrdersProps) {
  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
        <Link 
          href="/dashboard/seller/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-primary")}
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : !orders || orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No orders yet.</p>
          ) : (
            orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/seller/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-muted rounded flex items-center justify-center">
                    <Package className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} items • ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    order.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-500" :
                    order.status === 'CANCELLED' ? "bg-destructive/10 text-destructive" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    {order.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
