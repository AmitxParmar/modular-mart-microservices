import { OrdersContent } from '@/features/order/components/orders-content';

/**
 * Orders Page - Server Component
 * Next.js 16 Route Segment
 * 
 * Composition:
 * - OrdersContent (Client): Auth orchestration
 * - OrdersList (Client): Data fetching with Suspense
 */
export default function OrdersPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <OrdersContent />
    </div>
  );
}
