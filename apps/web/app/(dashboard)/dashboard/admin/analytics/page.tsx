"use client";

import { useAdminAnalytics } from "@/features/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useAdminAnalytics();

  const sections = [
    {
      title: "Revenue Performance",
      icon: <DollarSign className="w-4 h-4" />,
      value: `$${analytics?.revenue.total.toLocaleString()}`,
      growth: analytics?.revenue.growth,
      data: analytics?.revenue.data,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Active Users",
      icon: <Users className="w-4 h-4" />,
      value: analytics?.users.active.toLocaleString(),
      growth: analytics?.users.growth,
      data: analytics?.users.data,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Order Volume",
      icon: <ShoppingCart className="w-4 h-4" />,
      value: analytics?.orders.total.toLocaleString(),
      growth: analytics?.orders.growth,
      data: analytics?.orders.data,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep dive into platform growth and financial performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.title} className="border-border/40 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", section.bgColor, section.color)}>
                {section.icon}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{section.value}</div>
              )}
              <div className="flex items-center gap-1 mt-1 text-xs">
                {(section.growth || 0) >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-destructive" />
                )}
                <span className={cn(
                  (section.growth || 0) >= 0 ? "text-emerald-500" : "text-destructive"
                )}>
                  {Math.abs(section.growth || 0)}%
                </span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>

              <div className="mt-6 h-12 flex items-end gap-1">
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1 h-full rounded-sm" />
                  ))
                ) : (
                  section.data?.map((d, i) => {
                    const maxValue = Math.max(...section.data!.map(item => 'amount' in item ? item.amount : item.count));
                    const currentValue = 'amount' in d ? d.amount : d.count;
                    const height = (currentValue / maxValue) * 100;
                    return (
                      <div 
                        key={i} 
                        className={cn("flex-1 rounded-sm transition-all hover:opacity-80", section.bgColor.replace('/10', '/30'))}
                        style={{ height: `${height}%` }}
                        title={`${d.date}: ${currentValue}`}
                      />
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Daily Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                analytics?.revenue.data.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-sm font-medium">{d.date}</span>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Revenue</div>
                        <div className="text-sm font-bold">${d.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Users</div>
                        <div className="text-sm font-bold">{analytics.users.data[i]?.count || 0}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <p className="text-sm font-medium text-emerald-700">Revenue is up 15.4%</p>
                <p className="text-xs text-emerald-600/80 mt-1">Growth is primarily driven by electronics category promotions.</p>
              </div>
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <p className="text-sm font-medium text-amber-700">Order Volume decreased by 2.1%</p>
                <p className="text-xs text-amber-600/80 mt-1">Consider flash sales to stimulate order frequency mid-week.</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <p className="text-sm font-medium text-blue-700">User Retention improving</p>
                <p className="text-xs text-blue-600/80 mt-1">Daily active users reached a new peak of 842 this week.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
