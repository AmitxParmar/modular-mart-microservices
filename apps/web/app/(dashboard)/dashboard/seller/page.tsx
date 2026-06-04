"use client";

import { useSellerStats, useSellerProducts } from "@/features/seller/queries";
import { useSellerOrders } from "@/features/order/api/order.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function SellerDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useSellerStats();
  const { data: products, isLoading: isProductsLoading } = useSellerProducts();
  const { data: orders, isLoading: isOrdersLoading } = useSellerOrders();

  const SELLER_STATS = [
    {
      title: "Total Revenue",
      value: stats ? `$${Number(stats.totalEarnings).toLocaleString()}` : "$0",
      icon: <DollarSign className="size-4" />,
      color: "text-emerald-500",
      isLoading: isStatsLoading,
    },
    {
      title: "Active Products",
      value: products ? products.filter(p => p.status === 'APPROVED').length.toString() : "0",
      icon: <Package className="size-4" />,
      color: "text-blue-500",
      isLoading: isProductsLoading,
    },
    {
      title: "Pending Orders",
      value: stats ? stats.pendingOrders.toString() : "0",
      icon: <ShoppingCart className="size-4" />,
      color: "text-amber-500",
      isLoading: isStatsLoading,
    },
    {
      title: "Recent Earnings (30d)",
      value: stats ? `$${Number(stats.recentEarnings).toLocaleString()}` : "$0",
      icon: <TrendingUp className="size-4" />,
      color: "text-indigo-500",
      isLoading: isStatsLoading,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, orders, and track your performance.
          </p>
        </div>
        <Link 
          href="/dashboard/seller/products/new"
          className={cn(buttonVariants({ variant: "default" }), "rounded-full gap-2 shadow-lg shadow-primary/20")}
        >
          <PlusCircle className="size-4" />
          New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SELLER_STATS.map((stat) => (
          <Card key={stat.title} className="border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 bg-current/5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              {stat.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              {isOrdersLoading ? (
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
              {isProductsLoading ? (
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
      </div>
    </div>
  );
}
