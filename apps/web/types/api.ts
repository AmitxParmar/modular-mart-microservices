/**
 * API response types for apps/web — mirroring the real DB entity schemas.
 * These are plain interfaces (not ORM classes), safe for client-side use.
 *
 * Re-exports relevant event types from @repo/contracts where useful.
 */

// Re-export event-level types from the shared contracts package
export type { OrderItem as OrderEventItem } from '@repo/contracts';

// ─── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Order ─────────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddressId: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
