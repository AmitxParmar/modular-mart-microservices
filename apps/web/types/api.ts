/**
 * API response types for apps/web — mirroring the real DB entity schemas.
 * These are plain interfaces (not ORM classes), safe for client-side use.
 *
 * Re-exports relevant event types from @repo/contracts where useful.
 */

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  cursor?: string;
}

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}


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
  sellerId: string;
  status: ProductStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Address ───────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Order ─────────────────────────────────────────────────────────────────────

export interface ShippingAddressSnapshot {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  sellerId?: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddressId: string | null;
  shippingAddressSnapshot: ShippingAddressSnapshot | null;
  customerEmailSnapshot: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Admin & System ────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeProducts: number;
  totalOrders: number;
  uptime: string;
  trends: {
    users: number;
    products: number;
    orders: number;
  };
}

export interface ServiceHealthLog {
  id: string;
  serviceName: string;
  status: ServiceHealthStatus;
  latencyMs: number;
  errorDetails?: string;
  createdAt: string;
}

export interface UserManagementItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  createdAt: string;
}

export interface PlatformAnalytics {
  revenue: {
    total: number;
    growth: number;
    data: { date: string; amount: number }[];
  };
  users: {
    active: number;
    growth: number;
    data: { date: string; count: number }[];
  };
  orders: {
    total: number;
    growth: number;
    data: { date: string; count: number }[];
  };
}

