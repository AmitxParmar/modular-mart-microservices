"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  MapPin,
  Settings,
  ArrowRight,
  User,
  ShoppingCart,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

import { useUserOrders, useAddresses } from "@/features/user/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/features/order/components/order-status-badge";
import { format } from "date-fns";
import Image from "next/image";

export default function CustomerDashboard() {
  const { user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useUserOrders();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();

  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-border/40 bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-primary" />
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.firstName || "Customer"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your orders, addresses, and account settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
          <Link href="/customer/orders">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg flex items-center justify-between">
                My Orders
                {orders && <span className="text-xs font-normal text-muted-foreground">{orders.length} total</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View your order history, track shipments, and request returns.
              </p>
              <div className="flex items-center text-primary text-sm font-bold gap-1">
                View History <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
          <Link href="/dashboard/customer/addresses">
            <CardHeader>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg flex items-center justify-between">
                Address Book
                {addresses && <span className="text-xs font-normal text-muted-foreground">{addresses.length} saved</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your shipping and billing addresses for faster checkout.
              </p>
              <div className="flex items-center text-emerald-500 text-sm font-bold gap-1">
                Manage Addresses <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
          <Link href="/dashboard/customer/settings">
            <CardHeader>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Update your profile information, password, and notification
                preferences.
              </p>
              <div className="flex items-center text-amber-500 text-sm font-bold gap-1">
                Edit Profile <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
            {orders && orders.length > 0 && (
              <Link 
                href="/customer/orders" 
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-primary")}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">Order #{order.id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')} • {order.items.length} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold mb-1">${Number(order.totalAmount).toFixed(2)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-medium">No recent orders found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Start shopping to see your orders here.
                </p>
                <Link
                  href="/"
                  className={cn(buttonVariants({ variant: "default" }), "rounded-full px-8")}
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Default Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAddresses ? (
              <Skeleton className="h-24 w-full" />
            ) : addresses?.find((a) => a.isDefault) ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {addresses.find((a) => a.isDefault)?.street}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addresses.find((a) => a.isDefault)?.city},{" "}
                  {addresses.find((a) => a.isDefault)?.state}{" "}
                  {addresses.find((a) => a.isDefault)?.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {addresses.find((a) => a.isDefault)?.country}
                </p>
                <Link 
                  href="/dashboard/customer/addresses"
                  className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 text-primary h-auto mt-2")}
                >
                  Edit address
                </Link>
              </div>
            ) : (

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  No default address set.
                </p>
                <Link 
                  href="/dashboard/customer/addresses"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full rounded-full gap-2")}
                >
                  <MapPin className="w-4 h-4" />
                  Add Address
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

