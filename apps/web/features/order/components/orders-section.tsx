'use client';

import { useOrders } from '../api/order.queries';
import { OrderCard } from './order-card';

export function OrdersSection() {
  const { data: orders = [], isError } = useOrders();



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
        <h2 className="text-2xl font-bold tracking-tight">Your Orders</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} order{orders.length === 1 ? '' : 's'} placed so far.
        </p>
      </div>
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
