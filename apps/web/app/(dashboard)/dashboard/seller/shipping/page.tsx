"use client";

import { useSellerOrders } from "@/features/seller/queries";
import { useUpdateOrderStatus } from "@/features/seller/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@repo/contracts";
import { Truck, Package, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export default function SellerShippingPage() {
  const { data: orders, isLoading } = useSellerOrders();
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

  const shippingOrders = orders?.filter(o => 
    o.status === 'PAID' || o.status === 'APPROVED' || o.status === 'PROCESSING' || o.status === 'SHIPPED'
  );

  const handleShipOrder = (id: string) => {
    updateStatus({ id, status: 'SHIPPED' as any }, {
      onSuccess: () => toast.success("Order marked as shipped!"),
      onError: (err) => toast.error(`Failed to update order: ${err.message}`)
    });
  };

  const handleDeliverOrder = (id: string) => {
    updateStatus({ id, status: 'DELIVERED' as any }, {
      onSuccess: () => toast.success("Order marked as delivered!"),
      onError: (err) => toast.error(`Failed to update order: ${err.message}`)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Management</h1>
        <p className="text-muted-foreground mt-1">Track and update the delivery status of your orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : !shippingOrders || shippingOrders.length === 0 ? (
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground">No orders currently in the shipping pipeline.</p>
            </CardContent>
          </Card>
        ) : (
          shippingOrders.map((order) => (
            <Card key={order.id} className="border-border/40">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          order.status === 'SHIPPED' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {order.items.length} items • ${Number(order.totalAmount).toFixed(2)}
                      </p>
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <strong>Shipping to:</strong> {order.customerEmailSnapshot || "Guest Customer"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/dashboard/seller/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        Details <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    
                    {order.status === 'PAID' || order.status === 'APPROVED' || order.status === 'PROCESSING' ? (
                      <Button 
                        size="sm" 
                        className="gap-2" 
                        onClick={() => handleShipOrder(order.id)}
                        disabled={isPending}
                      >
                        <Truck className="w-4 h-4" />
                        Mark as Shipped
                      </Button>
                    ) : order.status === 'SHIPPED' ? (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="gap-2" 
                        onClick={() => handleDeliverOrder(order.id)}
                        disabled={isPending}
                      >
                        <Check className="w-4 h-4" />
                        Mark as Delivered
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
