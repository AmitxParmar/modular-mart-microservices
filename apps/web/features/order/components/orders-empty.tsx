"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

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
      <Button
        render={<Link href="/">Start Shopping</Link>}
        size="lg"
        className="px-8"
      />
    </div>
  );
}
