"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

const SERVICES = [
  { name: "API Gateway", status: "healthy", latency: "45ms" },
  { name: "User Service", status: "healthy", latency: "120ms" },
  { name: "Catalog Service", status: "healthy", latency: "85ms" },
  { name: "Order Service", status: "healthy", latency: "150ms" },
  { name: "Payment Service", status: "degraded", latency: "850ms" },
];

export default function ServiceHealth() {
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          Real-time Service Health
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full lowercase">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Live monitoring
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((service) => (
            <div 
              key={service.name} 
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20"
            >
              <div className="flex items-center gap-3">
                {service.status === "healthy" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${
                  service.status === "healthy" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {service.status.toUpperCase()}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Latency: {service.latency}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
