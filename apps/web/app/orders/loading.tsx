import { OrdersSkeleton } from '@/features/order/components/orders-skeleton';

/**
 * Route-level loading boundary for /orders
 * Triggers during Next.js navigation
 */
export default function OrdersLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <OrdersSkeleton />
    </div>
  );
}
