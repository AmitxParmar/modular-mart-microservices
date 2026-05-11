"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceHealthStatus } from "@/types/api";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useServiceHealth } from "@/features/admin/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ServiceHealth() {
  const { data: logs, isLoading, refetch, isFetching } = useServiceHealth();

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            Real-time Service Health{""}
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full lowercase">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              {" "}Live monitoring
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            : logs?.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    {service.status === ServiceHealthStatus.HEALTHY ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {service.serviceName.replaceAll("-", " ")}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        service.status === ServiceHealthStatus.HEALTHY
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}
                    >
                      {service.status.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Latency: {service.latencyMs}ms
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
