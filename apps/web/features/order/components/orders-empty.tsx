"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrdersEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl shadow-sm">
      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">No orders found</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        It looks like you haven't placed any orders yet. Start exploring our
        catalog!
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "px-8")}
      >
        Start Shopping
      </Link>
    </div>
  );
}
