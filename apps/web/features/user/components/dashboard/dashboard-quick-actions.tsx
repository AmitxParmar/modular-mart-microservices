import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardQuickActionsProps {
  ordersCount?: number;
  addressesCount?: number;
}

/**
 * Component for dashboard navigation cards.
 * Provides quick access to orders, addresses, and settings.
 */
export function DashboardQuickActions({ ordersCount, addressesCount }: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
        <Link href="/customer/orders">
          <CardHeader>
            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
              <Package className="size-5" />
            </div>
            <CardTitle className="text-lg flex items-center justify-between">
              My Orders
              {ordersCount !== undefined && (
                <span className="text-xs font-normal text-muted-foreground">
                  {ordersCount} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your order history, track shipments, and request returns.
            </p>
            <div className="flex items-center text-primary text-sm font-bold gap-1">
              View History <ArrowRight className="size-4" />
            </div>
          </CardContent>
        </Link>
      </Card>

      <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
        <Link href="/dashboard/customer/addresses">
          <CardHeader>
            <div className="size-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
              <MapPin className="size-5" />
            </div>
            <CardTitle className="text-lg flex items-center justify-between">
              Address Book
              {addressesCount !== undefined && (
                <span className="text-xs font-normal text-muted-foreground">
                  {addressesCount} saved
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your shipping and billing addresses for faster checkout.
            </p>
            <div className="flex items-center text-emerald-500 text-sm font-bold gap-1">
              Manage Addresses <ArrowRight className="size-4" />
            </div>
          </CardContent>
        </Link>
      </Card>

      <Card className="border-border/40 shadow-sm hover:shadow-md transition-all group">
        <Link href="/dashboard/customer/settings">
          <CardHeader>
            <div className="size-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 mb-2 group-hover:scale-110 transition-transform">
              <Settings className="size-5" />
            </div>
            <CardTitle className="text-lg">Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your profile information, password, and notification
              preferences.
            </p>
            <div className="flex items-center text-amber-500 text-sm font-bold gap-1">
              Edit Profile <ArrowRight className="size-4" />
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
