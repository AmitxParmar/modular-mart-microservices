"use client";

import ServiceHealth from "../_components/service-health";

export default function AdminHealthPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Health</h1>
        <p className="text-muted-foreground mt-1">Real-time status monitoring for all platform microservices.</p>
      </div>

      <div className="max-w-4xl">
        <ServiceHealth />
      </div>
    </div>
  );
}
