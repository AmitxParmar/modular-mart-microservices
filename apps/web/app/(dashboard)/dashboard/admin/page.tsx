"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { useAdminStats } from "@/features/admin/queries";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the health component as it might involve complex status checks
const ServiceHealth = dynamic(() => import("./_components/service-health"), {
  loading: () => <div className="h-48 w-full animate-pulse bg-muted rounded-xl" />,
  ssr: false
});

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  const dashboardStats = [
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() || "0", change: `${stats?.trends.users}%`, trend: (stats?.trends.users || 0) >= 0 ? "up" : "down", icon: <Users className="w-4 h-4" /> },
    { title: "Active Products", value: stats?.activeProducts?.toLocaleString() || "0", change: `${stats?.trends.products}%`, trend: (stats?.trends.products || 0) >= 0 ? "up" : "down", icon: <Package className="w-4 h-4" /> },
    { title: "Total Orders", value: stats?.totalOrders?.toLocaleString() || "0", change: `${stats?.trends.orders}%`, trend: (stats?.trends.orders || 0) >= 0 ? "up" : "down", icon: <ShoppingCart className="w-4 h-4" /> },
    { title: "System Uptime", value: stats?.uptime || "99.9%", change: "Stable", trend: "neutral", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Global management and system health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="border-border/40 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs">
                {stat.trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                {stat.trend === "down" && <ArrowDownRight className="w-3 h-3 text-destructive" />}
                <span className={
                  stat.trend === "up" ? "text-emerald-500" : 
                  stat.trend === "down" ? "text-destructive" : 
                  "text-muted-foreground"
                }>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
  

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <Suspense fallback={<div className="h-48 w-full animate-pulse bg-muted rounded-xl" />}>
            <ServiceHealth />
          </Suspense>
        </div>
        
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Recent System Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Backup completed successfully</p>
                    <p className="text-xs text-muted-foreground">User-Service Database • 2 hours ago</p>
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
