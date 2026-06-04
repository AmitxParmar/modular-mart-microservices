import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { format } from "date-fns";

interface RecentOrdersCardProps {
  orders: any[] | undefined;
  isLoading: boolean;
}

/**
 * Component for displaying the user's most recent orders.
 * Handles loading, empty, and data-filled states.
 */
export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <Card className="lg:col-span-2 border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
        {orders && orders.length > 0 && (
          <Link
            href="/customer/orders"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1 text-primary",
            )}
          >
            View all <ArrowRight className="size-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/10"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                    <ShoppingCart className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tight">
                      Order #{order.id.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")} •{" "}
                      {order.items.length} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold mb-1">
                    ${Number(order.totalAmount).toFixed(2)}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="size-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-medium">No recent orders found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Start shopping to see your orders here.
            </p>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-full px-8",
              )}
            >
              Start Shopping
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
