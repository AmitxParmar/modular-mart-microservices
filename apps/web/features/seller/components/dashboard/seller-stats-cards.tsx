import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SellerStatsCardsProps {
  stats: any;
  products: any[] | undefined;
  isStatsLoading: boolean;
  isProductsLoading: boolean;
}

/**
 * Component for displaying a grid of seller performance metrics.
 */
export function SellerStatsCards({ stats, products, isStatsLoading, isProductsLoading }: SellerStatsCardsProps) {
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
  );
}
