import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { OrderStatus, EVENT_PATTERNS } from '@repo/contracts';
import { OrderValidationService } from './order-validation.service';

/**
 * Service responsible for handling order-related events and state transitions.
 * Implements the transactional outbox pattern and saga orchestration logic.
 */
@Injectable()
export class OrderEventsService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    private readonly dataSource: DataSource,
    private readonly validationService: OrderValidationService,
  ) {}

  /**
   * Updates the status of an order and handles associated side-effects.
   * Side-effects include history recording and outbox event generation.
   * 
   * @param orderId - ID of the order to update.
   * @param sellerId - ID of the seller performing the update (for authorization).
   * @param newStatus - The target status.
   * @param reason - Optional reason for the status change.
   * @returns The updated order object.
   */
  async updateOrderStatus(
    orderId: string,
    sellerId: string,
    newStatus: OrderStatus,
    reason?: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, sellerId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.status;

    // 1. Validate the requested transition
    if (!this.validationService.isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // 2. Perform status update within a transaction to ensure atomic outbox events
    return await this.dataSource.transaction(async (manager) => {
      order.status = newStatus;
      if (newStatus === OrderStatus.REJECTED && reason) {
        order.rejectReason = reason;
      }
      const savedOrder = await manager.save(order);

      // Record the change in history
      const history = manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        status: newStatus,
        reason: reason || `Status updated to ${newStatus}`,
      });
      await manager.save(history);

      // 3. Generate associated outbox events for downstream services
      
      // Generic status update event
      const updateOutbox = manager.create(OutboxEvent, {
        eventType: EVENT_PATTERNS.ORDER_STATUS_UPDATED,
        payload: {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          previousStatus: currentStatus,
          newStatus,
          reason,
          updatedAt: new Date().toISOString(),
        },
      });
      await manager.save(updateOutbox);

      // Specific domain events based on the new status
      if (newStatus === OrderStatus.APPROVED) {
        const approveOutbox = manager.create(OutboxEvent, {
          eventType: EVENT_PATTERNS.ORDER_APPROVED,
          payload: {
            orderId: savedOrder.id,
            userId: savedOrder.userId,
            sellerId: savedOrder.sellerId,
            approvedAt: new Date().toISOString(),
          },
        });
        await manager.save(approveOutbox);
      } else if (newStatus === OrderStatus.REJECTED) {
        const rejectOutbox = manager.create(OutboxEvent, {
          eventType: EVENT_PATTERNS.ORDER_REJECTED,
          payload: {
            orderId: savedOrder.id,
            userId: savedOrder.userId,
            sellerId: savedOrder.sellerId,
            reason: reason || 'No reason provided',
            rejectedAt: new Date().toISOString(),
            items: savedOrder.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        });
        await manager.save(rejectOutbox);
      } else if (newStatus === OrderStatus.CANCELLED) {
        const cancelOutbox = manager.create(OutboxEvent, {
          eventType: EVENT_PATTERNS.ORDER_CANCELLED,
          payload: {
            orderId: savedOrder.id,
            userId: savedOrder.userId,
            sellerId: savedOrder.sellerId,
            reason: reason || 'No reason provided',
            cancelledAt: new Date().toISOString(),
            items: savedOrder.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        });
        await manager.save(cancelOutbox);
      }

      return savedOrder;
    });
  }

  /**
   * Marks an order as paid after receiving a payment success notification.
   * Implements idempotency via ProcessedMessage entity.
   * 
   * @param orderId - ID of the order to mark as paid.
   * @param paymentId - ID of the payment event (used for idempotency).
   */
  async markOrderAsPaid(orderId: string, paymentId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 1. Idempotency Check
      const alreadyProcessed = await manager.findOne(ProcessedMessage, {
        where: { id: paymentId },
      });

      if (alreadyProcessed) {
        this.logger.info(
          `Idempotency check: Payment event ${paymentId} already processed. Skipping.`,
        );
        return;
      }

      // 2. Update order status to PAID
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (order?.status === OrderStatus.PAYMENT_PENDING || order?.status === OrderStatus.PENDING) {
        order.status = OrderStatus.PAID;
        await manager.save(order);

        const history = manager.create(OrderStatusHistory, {
          orderId,
          status: OrderStatus.PAID,
          reason: 'Payment successful',
        });
        await manager.save(history);

        this.logger.info(
          { orderId, paymentId },
          `[Order Paid] Order ${orderId} successfully marked as PAID.`,
        );
      }

      // 3. Mark the message as processed to prevent duplicate processing
      const processed = manager.create(ProcessedMessage, {
        id: paymentId,
        eventType: EVENT_PATTERNS.PAYMENT_SUCCEEDED,
      });
      await manager.save(processed);
    });
  }

  /**
   * Handles successful stock reservation. Transitions order to PAYMENT_PENDING.
   * 
   * @param orderId - ID of the order.
   * @param items - List of reserved items.
   * @param messageId - Unique message ID for idempotency.
   */
  async handleStockReserved(
    orderId: string,
    items: { productId: string; quantity: number }[],
    messageId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const alreadyProcessed = await manager.findOne(ProcessedMessage, {
        where: { id: messageId },
      });
      if (alreadyProcessed) return;

      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order || order.status !== OrderStatus.PENDING_STOCK) return;

      // Transition to PAYMENT_PENDING and notify other services
      order.status = OrderStatus.PAYMENT_PENDING;
      const savedOrder = await manager.save(order);

      await manager.save(manager.create(OrderStatusHistory, {
        orderId,
        status: OrderStatus.PAYMENT_PENDING,
        reason: 'Stock successfully reserved, awaiting payment.',
      }));

      // Notify other services that the order is now officially "created" (stock secured)
      const outboxEvent = manager.create(OutboxEvent, {
        eventType: EVENT_PATTERNS.ORDER_CREATED,
        payload: {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          sellerId: savedOrder.sellerId,
          totalAmount: savedOrder.totalAmount,
          createdAt: savedOrder.createdAt,
          items: items,
        },
      });
      await manager.save(outboxEvent);

      await manager.save(manager.create(ProcessedMessage, {
        id: messageId,
        eventType: EVENT_PATTERNS.STOCK_RESERVED,
      }));
    });
  }

  /**
   * Handles payment failure. Cancels the order and releases reserved stock.
   * 
   * @param orderId - ID of the order.
   * @param reason - Reason for payment failure.
   * @param messageId - Unique message ID for idempotency.
   */
  async handlePaymentFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const alreadyProcessed = await manager.findOne(ProcessedMessage, {
        where: { id: messageId },
      });
      if (alreadyProcessed) return;

      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order || ![OrderStatus.PAYMENT_PENDING, OrderStatus.PENDING_STOCK].includes(order.status)) return;

      // Cancel the order
      order.status = OrderStatus.CANCELLED;
      order.rejectReason = reason || 'Payment failed';
      const savedOrder = await manager.save(order);

      await manager.save(manager.create(OrderStatusHistory, {
        orderId,
        status: OrderStatus.CANCELLED,
        reason: `Payment failed: ${order.rejectReason}`,
      }));

      // Notify other services (e.g., Inventory to release stock)
      const cancelOutbox = manager.create(OutboxEvent, {
        eventType: EVENT_PATTERNS.ORDER_CANCELLED,
        payload: {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          sellerId: savedOrder.sellerId,
          reason: reason || 'Payment failed after stock reservation',
          cancelledAt: new Date().toISOString(),
          items: savedOrder.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      });
      await manager.save(cancelOutbox);

      await manager.save(manager.create(ProcessedMessage, {
        id: messageId,
        eventType: EVENT_PATTERNS.PAYMENT_FAILED,
      }));
    });
  }

  /**
   * Handles stock reservation failure. Transitions order to STOCK_FAILED.
   * 
   * @param orderId - ID of the order.
   * @param reason - Reason for stock failure.
   * @param messageId - Unique message ID for idempotency.
   */
  async handleStockReserveFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const alreadyProcessed = await manager.findOne(ProcessedMessage, {
        where: { id: messageId },
      });
      if (alreadyProcessed) return;

      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order || order.status !== OrderStatus.PENDING_STOCK) return;

      // Transition to STOCK_FAILED
      order.status = OrderStatus.STOCK_FAILED;
      order.rejectReason = reason || 'Insufficient stock';
      const savedOrder = await manager.save(order);

      await manager.save(manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        status: OrderStatus.STOCK_FAILED,
        reason: `Stock reservation failed: ${order.rejectReason}`,
      }));

      await manager.save(manager.create(ProcessedMessage, {
        id: messageId,
        eventType: EVENT_PATTERNS.STOCK_RESERVE_FAILED,
      }));
    });
  }
}
