'use client';

import { useOrders } from './queries';
import { OrderCard } from './order-card';

export function OrdersSection() {
  const { data: orders = [], isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load orders. Make sure you are signed in and the orders service is running.
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No orders yet. Start shopping!
      </p>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} order{orders.length !== 1 ? 's' : ''} — expand to see line items.
        </p>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
