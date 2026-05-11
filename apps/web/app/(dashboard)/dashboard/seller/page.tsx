"use client";

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

const SELLER_STATS = [
  {
    title: "Monthly Revenue",
    value: "$12,450.00",
    icon: <DollarSign className="w-4 h-4" />,
    color: "text-emerald-500",
  },
  {
    title: "Active Listings",
    value: "24",
    icon: <Package className="w-4 h-4" />,
    color: "text-blue-500",
  },
  {
    title: "Pending Orders",
    value: "7",
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-amber-500",
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-indigo-500",
  },
];

export default function SellerDashboard() {
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
          <PlusCircle className="w-4 h-4" />
          New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SELLER_STATS.map((stat) => (
          <Card key={stat.title} className="border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 bg-current/5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Order #ORD-2024-{i}283
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 items • $129.99
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                      PENDING
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      2 hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">
              Top Performing Products
            </CardTitle>
            <Link 
              href="/dashboard/seller/products"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-primary")}
            >
              Inventory <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                      <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Premium Modular Item {i}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        42 sales this month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">$199.99</p>
                    <p className="text-[10px] text-emerald-500">+12% growth</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
