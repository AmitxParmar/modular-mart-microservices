"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrderTracking } from "@/features/order/api/order.queries";
import { useUpdateOrderStatus } from "@/features/order/api/order.mutations";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { OrderTimeline } from "@/features/order/components/OrderTimeline";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  X,
  Package,
  Truck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

export default function SellerOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: order, isLoading, error } = useOrderTracking(id);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load order details.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = (status: string, reason?: string) => {
    updateStatus(
      { id, status, reason },
      {
        onSuccess: () => {
          toast.success("Status Updated", {
            description: `Order status has been changed to ${status}.`,
          });
          setShowRejectInput(false);
          setRejectReason("");
        },
        onError: (err) => {
          let message = "Failed to update status.";

          if (axios.isAxiosError(err)) {
            message = err.response?.data?.message || message;
          } else if (err instanceof Error) {
            message = err.message;
          }

          toast.error("Update Failed", {
            description: message,
          });
        },
      },
    );
  };

  const getAvailableActions = () => {
    switch (order.status) {
      case "PAID":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate("APPROVED")}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" /> Approve Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectInput(!showRejectInput)}
              disabled={isUpdating}
            >
              <X className="w-4 h-4 mr-2" /> Reject Order
            </Button>
          </div>
        );
      case "APPROVED":
        return (
          <Button
            onClick={() => handleStatusUpdate("PROCESSING")}
            disabled={isUpdating}
          >
            <Package className="w-4 h-4 mr-2" /> Start Processing
          </Button>
        );
      case "PROCESSING":
        return (
          <Button
            onClick={() => handleStatusUpdate("SHIPPED")}
            disabled={isUpdating}
          >
            <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
          </Button>
        );
      case "SHIPPED":
        return (
          <Button
            onClick={() => handleStatusUpdate("DELIVERED")}
            disabled={isUpdating}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          render={
            <Link href="/dashboard/seller/orders">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          }
          variant="ghost"
          size="icon"
        />
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {format(new Date(order.createdAt), "PPP")}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {item?.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-sm">
                    ${Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold pt-2">
                <span>Total Amount</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {order.shippingAddressSnapshot ? (
                <>
                  <p className="font-medium">
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
                  <p className="pt-2 text-muted-foreground">
                    Email: {order.customerEmailSnapshot}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No address information available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Update the lifecycle of this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getAvailableActions() || (
                <p className="text-sm text-muted-foreground italic">
                  No actions available for current status.
                </p>
              )}

              {showRejectInput && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Reason for Rejection</Label>
                    <Input
                      id="reason"
                      placeholder="e.g. Out of stock"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate("REJECTED", rejectReason)}
                    disabled={!rejectReason || isUpdating}
                  >
                    Confirm Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline history={order.history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
