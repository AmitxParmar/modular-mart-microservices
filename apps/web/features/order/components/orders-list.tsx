'use client';

import { useSuspenseOrders } from '@/features/order/api/order.queries';
import { OrderCard } from '@/features/order/components/order-card';
import { OrdersEmpty } from './orders-empty';

export function OrdersList() {
  const { data: orders } = useSuspenseOrders();

  if (orders.length === 0) {
    return <OrdersEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
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
    </div>
  );
}
