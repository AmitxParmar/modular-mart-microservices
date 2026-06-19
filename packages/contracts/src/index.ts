/**
 * @repo/contracts — Shared event payload types for RabbitMQ messaging.
 *
 * RULE: This package must contain NO runtime code.
 * Only TypeScript interfaces, types, and enums.
 *
 * When you change a type here, both the publisher and subscriber
 * services will get a compile-time error if they're out of sync.
 */

/**
 * Event versioning convention:
 *   - All patterns carry a `.v1` suffix.
 *   - When a breaking schema change is needed, add `.v2` patterns and deploy
 *     consumers BEFORE updating publishers (blue-green consumer upgrade).
 */
export const EVENT_PATTERNS = {
  USER_CREATED: 'user.created.v1',
  USER_UPDATED: 'user.updated.v1',
  USER_DELETED: 'user.deleted.v1',
  GET_USER_ROLE: 'user.get_role.v1',
  GET_USER_ID: 'user.get_id.v1',
  ORDER_CREATED: 'order.created.v1',
  ORDER_APPROVED: 'order.approved.v1',
  ORDER_REJECTED: 'order.rejected.v1',
  ORDER_STATUS_UPDATED: 'order.status_updated.v1',
  ORDER_DELIVERED: 'order.delivered.v1',
  ORDER_CANCELLED: 'order.cancelled.v1',
  STOCK_RESERVED: 'stock.reserved.v1',
  STOCK_RELEASED: 'stock.released.v1',
  STOCK_RESERVE_REQUESTED: 'stock.reserve.requested.v1',
  STOCK_RESERVE_FAILED: 'stock.reserve.failed.v1',
  ORDER_PAID: 'order.paid.v1',
  PAYMENT_SUCCEEDED: 'payment.succeeded.v1',
  PAYMENT_FAILED: 'payment.failed.v1',
} as const;

export type EventPattern = (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS];

/**
 * Notification priority field — replaces the old 3-queue priority system.
 * Producers attach this to any event; notification-service handles dispatch internally.
 */
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_STOCK = 'PENDING_STOCK',
  STOCK_CONFIRMED = 'STOCK_CONFIRMED',
  STOCK_FAILED = 'STOCK_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
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

export interface GetUserIdPayload {
  clerkId: string;
}

export interface GetUserIdResponse {
  internalId: string | null;
}

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
  /** Optional priority hint for the notification-service internal dispatcher. */
  priority?: NotificationPriority;
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
  priority?: NotificationPriority;
}

export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
  reason: string;
  failedAt: string;
  priority?: NotificationPriority;
}
