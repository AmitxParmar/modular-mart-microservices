import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DefaultAddressCardProps {
  addresses: any[] | undefined;
  isLoading: boolean;
}

/**
 * Component for displaying the user's primary/default address on the dashboard.
 */
export function DefaultAddressCard({ addresses, isLoading }: DefaultAddressCardProps) {
  const defaultAddress = addresses?.find((a) => a.isDefault);

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Default Address</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : defaultAddress ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {defaultAddress.street}
            </p>
            <p className="text-sm text-muted-foreground">
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
            </p>
            <p className="text-sm text-muted-foreground">
              {defaultAddress.country}
            </p>
            <Link
              href="/dashboard/customer/addresses"
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "px-0 text-primary h-auto mt-2",
              )}
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
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full rounded-full gap-2",
              )}
            >
              <MapPin className="size-4" />
              Add Address
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
