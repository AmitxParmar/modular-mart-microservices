"use client";

import { useUser } from "@clerk/nextjs";
import { useAuthDialog } from "@/features/auth/auth-dialog-context";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface CheckoutAuthGuardProps {
  children: React.ReactNode;
}

export function CheckoutAuthGuard({ children }: Readonly<CheckoutAuthGuardProps>) {
  const { isLoaded, isSignedIn } = useUser();
  const { openDialog } = useAuthDialog();

  // Automatically open the sign-in dialog if the user reaches this page unauthenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      openDialog("signIn");
    }
  }, [isLoaded, isSignedIn, openDialog]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/30 border border-dashed border-border/60 rounded-3xl animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Authentication Required
        </h2>
        <p className="text-muted-foreground max-w-sm mb-8">
          Please sign in to your account to complete your purchase and secure your order.
        </p>
        <Button size="lg" onClick={() => openDialog("signIn")} className="rounded-full px-12 h-14 text-lg font-bold shadow-lg">
          Sign In to Checkout
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
