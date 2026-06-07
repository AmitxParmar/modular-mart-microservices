"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { StripeProvider, PaymentForm, OrderSummary, CheckoutAuthGuard } from "@/features/checkout";
import { useOrder } from "@/features/order/api/order.queries";
import { OrderStatus } from "@/types/api";

export default function RetryCheckoutPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="size-12 text-destructive" />
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Link href="/customer/orders" className="text-primary hover:underline">
          Back to Your Orders
        </Link>
      </div>
    );
  }

  // If order is already paid or cancelled, redirect back
  if (order.status !== OrderStatus.PAYMENT_PENDING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="size-12 text-yellow-500" />
        <h2 className="text-2xl font-bold">Payment no longer required</h2>
        <p className="text-muted-foreground">
          This order is currently in {order.status} state.
        </p>
        <Link href="/customer/orders" className="text-primary hover:underline">
          View Order History
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StripeProvider totalAmount={Number(order.totalAmount)}>
        {/* Simplified Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/customer/orders"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Orders
            </Link>
            <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
              ModularMart
            </Link>
            <div className="w-24" />
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Main Checkout Flow (Left Column) */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Complete Payment</h1>
                <p className="text-muted-foreground mt-2 font-medium">
                  Order # {order.id.split('-')[0]?.toUpperCase()}
                </p>
              </div>
              
              <CheckoutAuthGuard>
                <div className="space-y-6">
                  <div className="p-8 rounded-3xl border border-primary bg-muted/30 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight text-foreground mb-6">
                      Payment Details
                    </h3>
                    <PaymentForm 
                      existingOrderId={order.id}
                      existingAmount={Number(order.totalAmount)}
                    />
                  </div>
                </div>
              </CheckoutAuthGuard>
            </div>

            {/* Order Summary (Right Column) */}
            <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 self-start">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>
              
              <div className="p-8 rounded-3xl bg-muted/30 border border-border/40">
                <OrderSummary 
                  items={order.items.map(item => ({
                    product: {
                      id: item.productId,
                      name: item.product?.name || `Product ${item.productId}`,
                      price: Number(item.unitPrice)
                    },
                    quantity: item.quantity
                  }))}
                  totalAmount={Number(order.totalAmount)}
                />
              </div>
            </aside>

          </div>
        </main>
      </StripeProvider>

      {/* Trust Footer */}
      <footer className="mt-auto py-12 border-t border-border/40 bg-muted/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground space-y-4">
          <p>© 2026 ModularMart. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <span>Secure Checkout</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
