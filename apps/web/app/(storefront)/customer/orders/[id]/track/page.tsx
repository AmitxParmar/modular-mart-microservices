"use client";

import { useParams } from "next/navigation";
import { useOrderTracking } from "@/features/order/api/order.queries";
import { OrderTimeline } from "@/features/order/components/OrderTimeline";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { Package, MapPin, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CustomerOrderTrackingPage() {
  const { id } = useParams() as { id: string };
  const { data: order, isLoading, error } = useOrderTracking(id);

  if (isLoading) {
    return (
      <div className="container py-12 space-y-8">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="md:col-span-2 h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Tracking Information Not Found
        </h1>
        <p className="text-muted-foreground mt-2">
          We couldn&apos;t find the tracking details for this order.
        </p>
        <Link className={buttonVariants()} href="/customer/orders">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-6xl mx-auto space-y-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/customer/orders"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Track Order</h1>
          <p className="text-muted-foreground">Order #{order.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium">Estimated Delivery</p>
            <p className="text-xs text-muted-foreground">Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Live Tracking
            </CardTitle>
            <CardDescription>
              Real-time updates on your shipment status.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <OrderTimeline history={order.history} />
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-slate-500" />
                Shipping To
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {order.shippingAddressSnapshot ? (
                <>
                  <p className="font-semibold text-slate-900 mb-1">
                    {order.shippingAddressSnapshot.fullName}
                  </p>
                  <p>{order.shippingAddressSnapshot.addressLine1}</p>
                  {order.shippingAddressSnapshot.addressLine2 && (
                    <p>{order.shippingAddressSnapshot.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddressSnapshot.city},{" "}
                    {order.shippingAddressSnapshot.state}{" "}
                    {order.shippingAddressSnapshot.postalCode}
                  </p>
                  <p>{order.shippingAddressSnapshot.country}</p>
                </>
              ) : (
                <p>Digital Order / No Address</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-4 h-4 text-slate-500" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item?.product?.name}{" "}
                      <span className="text-xs">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      ${Number(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Paid</span>
                  <span>${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
            <p className="text-sm text-slate-600 mb-4">
              If you have any questions about your order, please contact our
              support team.
            </p>
            <Button variant="outline" className="w-full bg-white">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
