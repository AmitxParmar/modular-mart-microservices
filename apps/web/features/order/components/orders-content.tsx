'use client';

import { useAuth } from '@clerk/nextjs';
import { OrdersAuthRequired } from './orders-auth-required';
import { OrdersList } from './orders-list';
import { OrdersSkeleton } from './orders-skeleton';
import { Suspense } from 'react';
import Link from 'next/link';

export function OrdersContent() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <OrdersSkeleton />;
  }

  if (!isSignedIn) {
    return <OrdersAuthRequired />;
  }

  return (
    <div className="flex flex-col space-y-8">
      <nav className="flex text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">Your Account</Link>
          </li>
          <li className="flex items-center space-x-2">
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium">Your Orders</span>
          </li>
        </ol>
      </nav>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}
