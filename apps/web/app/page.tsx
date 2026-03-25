import { ProductsSection } from '@/features/products/products-section';
import { OrdersSection } from '@/features/order/orders-section';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <ProductsSection />
      <OrdersSection />
    </main>
  );
}
