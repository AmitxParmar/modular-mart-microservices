"use client";

import { useSellerStats, useSellerProducts } from "@/features/seller/queries";
import { useSellerOrders } from "@/features/order/api/order.queries";
import { PlusCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SellerStatsCards } from "@/features/seller/components/dashboard/seller-stats-cards";
import { SellerRecentOrders } from "@/features/seller/components/dashboard/seller-recent-orders";
import { SellerProductOverview } from "@/features/seller/components/dashboard/seller-product-overview";

/**
 * Main entry point for the Seller Hub dashboard.
 * Uses a composition pattern to display revenue, products, and order summaries.
 */
export default function SellerDashboard() {
  const { data: stats, isLoading: isStatsLoading } = useSellerStats();
  const { data: products, isLoading: isProductsLoading } = useSellerProducts();
  const { data: orders, isLoading: isOrdersLoading } = useSellerOrders();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Page Header */}
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

      {/* 2. Key Metrics Grid */}
      <SellerStatsCards 
        stats={stats} 
        products={products} 
        isStatsLoading={isStatsLoading} 
        isProductsLoading={isProductsLoading} 
      />

      {/* 3. Detailed Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SellerRecentOrders 
          orders={orders} 
          isLoading={isOrdersLoading} 
        />

        <SellerProductOverview 
          products={products} 
          isLoading={isProductsLoading} 
        />
      </div>
    </div>
  );
}
