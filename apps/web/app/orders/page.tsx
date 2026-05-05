import { OrdersSection } from '@/features/order';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Your Orders | ModularMart',
  description: 'View and track your orders.',
};

export default function OrdersPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

        <OrdersSection />
      </div>
    </div>
  );
}
