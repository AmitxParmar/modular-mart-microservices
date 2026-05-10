"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";

export function OrdersAuthRequired() {
  const { openDialog } = useAuthDialog();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-dashed border-border rounded-xl">
      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Authentication Required
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        Please sign in to your account to view your order history and track your
        deliveries.
      </p>
      <div className="flex items-center gap-4">
        <Button size="lg" onClick={() => openDialog("signIn")} className="px-8">
          Sign In
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
