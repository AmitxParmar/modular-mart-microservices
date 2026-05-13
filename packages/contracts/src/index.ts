/**
 * @repo/contracts — Shared event payload types for RabbitMQ messaging.
 *
 * RULE: This package must contain NO runtime code.
 * Only TypeScript interfaces, types, and enums.
 *
 * When you change a type here, both the publisher and subscriber
 * services will get a compile-time error if they're out of sync.
 */

// ─── Routing keys (use these constants for RabbitMQ routing) ─────────────────
export const EVENT_PATTERNS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  GET_USER_ROLE: 'user.get_role',
  ORDER_CREATED: 'order.created',
  ORDER_APPROVED: 'order.approved',
  ORDER_REJECTED: 'order.rejected',
  ORDER_STATUS_UPDATED: 'order.status_updated',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  STOCK_RESERVED: 'stock.reserved',
  STOCK_RELEASED: 'stock.released',
  ORDER_PAID: 'order.paid',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
} as const;

export type EventPattern = (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS];

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

export interface GetUserRolePayload {
  userId: string;
}

export type GetUserRoleResponse = string[];

// ─── User Events ──────────────────────────────────────────────────────────────

export interface UserCreatedEvent {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string; // ISO 8601
}

export interface UserUpdatedEvent {
  userId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  updatedAt: string;
}

export interface UserDeletedEvent {
  userId: string;
  deletedAt: string;
}

// ─── Order Events ─────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; // in smallest currency unit (e.g. paise / cents)
}

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  userId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  reason?: string;
  updatedAt: string;
}

export interface OrderApprovedEvent {
  orderId: string;
  userId: string;
  sellerId: string;
  approvedAt: string;
}

export interface OrderRejectedEvent {
  orderId: string;
  userId: string;
  sellerId: string;
  reason: string;
  rejectedAt: string;
}

export interface OrderDeliveredEvent {
  orderId: string;
  userId: string;
  deliveredAt: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  userId: string;
  reason: string | null;
  cancelledAt: string;
}

// ─── Stock Events ─────────────────────────────────────────────────────────────

export interface StockReservedEvent {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  reservedAt: string;
}

export interface StockReleasedEvent {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  releasedAt: string;
}

// ─── Payment Events ───────────────────────────────────────────────────────────

export interface PaymentSucceededEvent {
  orderId: string;
  userId: string;
  paymentId: string;
  amount: number;
  currency: string;
  paidAt: string;
}

export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
  reason: string;
  failedAt: string;
}
