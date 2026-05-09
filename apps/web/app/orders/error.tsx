'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function OrdersError({
  error,
  reset,
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto py-20 px-4">
      <div className="flex flex-col items-center justify-center text-center bg-destructive/5 border border-destructive/10 rounded-xl p-8 sm:p-12">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Failed to load orders
        </h2>

        <p className="text-muted-foreground mb-8 max-w-md">
          Something went wrong while fetching your orders. This could be a temporary connection issue.
          Please try again.
        </p>

        <div className="flex items-center gap-4">
          <Button onClick={() => reset()} size="lg" className="px-8">
            Try Again
          </Button>
          <Button variant="outline" size="lg" onClick={() => globalThis.location.reload()} className="px-8">
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
