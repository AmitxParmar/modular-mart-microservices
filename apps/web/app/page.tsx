import { ProductGrid } from '@/features/products/product-grid';
import { OrderCard } from '@/features/order/order-card';
import { OrderStatus } from '@/types/api';
import type { Product, Order } from '@/types/api';

// ─── Mock data for visual verification ─────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Wireless Noise-Cancelling Headphones',
    slug: 'wireless-nc-headphones',
    description: 'Premium over-ear headphones with 30-hour battery life and active noise cancellation.',
    price: 299.99,
    stockQuantity: 42,
    category: { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: null, createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mechanical Keyboard TKL',
    slug: 'mechanical-keyboard-tkl',
    description: 'Tenkeyless layout with Cherry MX Red switches. RGB backlit.',
    price: 129.00,
    stockQuantity: 5,
    category: { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: null, createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Minimalist Leather Wallet',
    slug: 'minimalist-leather-wallet',
    description: 'Slim bifold wallet, genuine full-grain leather, fits 8 cards.',
    price: 49.99,
    stockQuantity: 0,
    category: { id: 'cat-2', name: 'Accessories', slug: 'accessories', description: null, createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Ergonomic Laptop Stand',
    slug: 'ergonomic-laptop-stand',
    description: 'Adjustable aluminum stand with 6 height levels. Compatible with all 13"-17" laptops.',
    price: 79.00,
    stockQuantity: 18,
    category: { id: 'cat-3', name: 'Workspace', slug: 'workspace', description: null, createdAt: '', updatedAt: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    userId: 'user_123',
    status: OrderStatus.DELIVERED,
    totalAmount: 429.99,
    shippingAddressId: null,
    items: [
      { id: 'i1', productId: '1', quantity: 1, unitPrice: 299.99 },
      { id: 'i2', productId: '4', quantity: 1, unitPrice: 79.00 },
      { id: 'i3', productId: '3', quantity: 1, unitPrice: 49.99 },
    ],
    createdAt: '2026-03-15T10:30:00.000Z',
    updatedAt: '2026-03-20T14:00:00.000Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    userId: 'user_123',
    status: OrderStatus.SHIPPED,
    totalAmount: 129.00,
    shippingAddressId: null,
    items: [
      { id: 'i4', productId: '2', quantity: 1, unitPrice: 129.00 },
    ],
    createdAt: '2026-03-22T09:00:00.000Z',
    updatedAt: '2026-03-24T11:00:00.000Z',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    userId: 'user_123',
    status: OrderStatus.PENDING,
    totalAmount: 49.99,
    shippingAddressId: null,
    items: [
      { id: 'i5', productId: '3', quantity: 1, unitPrice: 49.99 },
    ],
    createdAt: '2026-03-25T20:00:00.000Z',
    updatedAt: '2026-03-25T20:00:00.000Z',
  },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Products */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browsing {MOCK_PRODUCTS.length} products from the catalog service.
          </p>
        </div>
        <ProductGrid products={MOCK_PRODUCTS} />
      </section>

      {/* Orders */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">My Orders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {MOCK_ORDERS.length} orders — click the arrow to expand line items.
          </p>
        </div>
        <div className="space-y-3">
          {MOCK_ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>
    </main>
  );
}
