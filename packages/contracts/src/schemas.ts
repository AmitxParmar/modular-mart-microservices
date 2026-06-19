/**
 * @repo/contracts — Zod runtime schemas for all RabbitMQ event payloads.
 *
 * Every consumer MUST validate incoming payloads against the relevant schema
 * before processing. This prevents corrupted or maliciously crafted messages
 * from causing broken saga state or DB corruption.
 *
 * Usage in a consumer:
 *   const parsed = EventSchemas.StockReserved.safeParse(payload);
 *   if (!parsed.success) {
 *     logger.error(`Invalid payload: ${parsed.error.message}`);
 *     return; // ack the message, don't reprocess malformed data
 *   }
 *   const data = parsed.data;
 */

import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

const UUIDString = z.string().min(1);
const ISODateString = z.iso.datetime({ offset: true }).or(z.string().min(1));

// ─── Stock Events ─────────────────────────────────────────────────────────────

const StockItem = z.object({
  productId: UUIDString,
  quantity: z.number().int().positive(),
});

const StockReserved = z.object({
  orderId: UUIDString,
  items: z.array(StockItem).min(1),
  reservedAt: ISODateString,
});

const StockReleased = z.object({
  orderId: UUIDString,
  items: z.array(StockItem).min(1),
  releasedAt: ISODateString,
});

const StockReserveRequested = z.object({
  orderId: UUIDString,
  items: z.array(StockItem).min(1),
});

const StockReserveFailed = z.object({
  orderId: UUIDString,
  reason: z.string(),
});

// ─── Order Events ─────────────────────────────────────────────────────────────

const OrderItem = z.object({
  productId: UUIDString,
  name: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

const OrderCreated = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  items: z.array(OrderItem).min(1),
  totalAmount: z.number().nonnegative(),
  currency: z.string().default('INR'),
  createdAt: ISODateString,
});

const OrderStatusUpdated = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  previousStatus: z.string(),
  newStatus: z.string(),
  reason: z.string().optional(),
  updatedAt: ISODateString,
});

const OrderApproved = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  sellerId: UUIDString,
  approvedAt: ISODateString,
});

const OrderRejected = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  sellerId: UUIDString,
  reason: z.string(),
  rejectedAt: ISODateString,
});

const OrderCancelled = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  reason: z.string().nullable().optional(),
  cancelledAt: ISODateString,
});

const OrderDelivered = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  deliveredAt: ISODateString,
});

// ─── Payment Events ───────────────────────────────────────────────────────────

const PaymentSucceeded = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  paymentId: UUIDString,
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paidAt: ISODateString,
});

const PaymentFailed = z.object({
  orderId: UUIDString,
  userId: UUIDString,
  reason: z.string(),
  failedAt: ISODateString,
});

// ─── User Events ──────────────────────────────────────────────────────────────

const UserCreated = z.object({
  userId: z.string().min(1),
  email: z.email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: ISODateString,
});

const UserUpdated = z.object({
  userId: z.string().min(1),
  email: z.email().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  updatedAt: ISODateString,
});

const UserDeleted = z.object({
  userId: z.string().min(1),
  deletedAt: ISODateString,
});

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * EventSchemas — use `.safeParse()` in every consumer to validate payloads.
 *
 * Example:
 *   const parsed = EventSchemas.StockReserved.safeParse(payload);
 *   if (!parsed.success) { ... nack and log ... }
 */
export const EventSchemas = {
  // Stock
  StockReserved,
  StockReleased,
  StockReserveRequested,
  StockReserveFailed,
  // Orders
  OrderCreated,
  OrderStatusUpdated,
  OrderApproved,
  OrderRejected,
  OrderCancelled,
  OrderDelivered,
  // Payments
  PaymentSucceeded,
  PaymentFailed,
  // Users
  UserCreated,
  UserUpdated,
  UserDeleted,
} as const;

export type EventSchemaKeys = keyof typeof EventSchemas;
