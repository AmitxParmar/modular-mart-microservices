"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  MapPin,
  Settings,
  Heart,
  ArrowRight,
  User,
  ShoppingCart,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export default function CustomerDashboard() {
  const { user } = useUser();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-border/40 bg-muted/20">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
          {user?.imageUrl ? (
            <img
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
          <Link href="/dashboard/customer/orders">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">My Orders</CardTitle>
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
              <CardTitle className="text-lg">Address Book</CardTitle>
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
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              Wishlist Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your wishlist is currently empty.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full gap-2"
              >
                <Heart className="w-4 h-4" />
                Find items to save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
