import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClerkUser } from '@repo/auth';
import { OrderStatus, EVENT_PATTERNS } from '@repo/contracts';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    let internalId = user.internalId || createOrderDto.userId;

    if (!internalId) {
      this.logger.info(
        `createOrder: Missing internalId for Clerk User ${user.userId}. Attempting fallback via messaging.`,
      );
      try {
        const response = await firstValueFrom(
          this.authClient.send(
            { cmd: EVENT_PATTERNS.GET_USER_ID },
            { clerkId: user.userId },
          ),
        );
        
        if (response?.internalId) {
          internalId = response.internalId;
          this.logger.info(`createOrder: Successfully resolved internalId ${internalId} via fallback.`);
        }
      } catch (error) {
        this.logger.error(`createOrder: Fallback internalId resolution failed: ${error.message}`);
      }
    }

    if (!internalId) {
      this.logger.warn(
        `createOrder: No internalId found for Clerk User ${user.userId} even after fallback.`,
      );
      throw new UnprocessableEntityException(
        'Your account has not finished setting up. Please try again in a moment or contact support.',
      );
    }

    try {
      // Fetch product info from catalog-service
      const productIds = createOrderDto.items.map((i) => i.productId);
      const products: any[] = await firstValueFrom(
        this.catalogClient.send<any[]>('products.get_batch', productIds).pipe(
          timeout(5000),
        )
      );

      return await this.dataSource.transaction(async (manager) => {
        // 1. Group requested items by seller
        const itemsBySeller: Record<
          string,
          { product: any; quantity: number }[]
        > = {};

        for (const item of createOrderDto.items) {
          const product = products.find((p) => p.id === item.productId);

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }
          
          const sellerId = product.sellerId || 'PLATFORM'; // Fallback if sellerId is missing
          if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push({ product, quantity: item.quantity });
        }

        const createdOrders: Order[] = [];

        // 2. Create a separate Order for each seller
        for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
          let totalAmount = 0;
          const orderItems: OrderItem[] = [];

          for (const item of sellerItems) {
            const unitPrice = Number(item.product.price);
            totalAmount += unitPrice * item.quantity;

            const orderItem = manager.create(OrderItem, {
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice,
            });
            orderItems.push(orderItem);
          }

          const order = manager.create(Order, {
            userId: internalId,
            sellerId,
            customerEmailSnapshot: user.email ?? null,
            status: OrderStatus.PENDING_STOCK,
            totalAmount,
            shippingAddressId: createOrderDto.shippingAddressId ?? undefined,
            shippingAddressSnapshot:
              createOrderDto.shippingAddressSnapshot ?? undefined,
            items: orderItems,
          });

          const savedOrder = await manager.save(order);

          // 3. Record initial status history
          const history = manager.create(OrderStatusHistory, {
            orderId: savedOrder.id,
            status: OrderStatus.PENDING_STOCK,
            reason: 'Order created in pending stock state',
          });
          await manager.save(history);

          createdOrders.push(savedOrder);

          // 4. Save Outbox Event instead of immediate publish
          const outboxEvent = manager.create(OutboxEvent, {
            eventType: EVENT_PATTERNS.STOCK_RESERVE_REQUESTED,
            payload: {
              orderId: savedOrder.id,
              items: sellerItems.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
              })),
            },
          });
          await manager.save(outboxEvent);
        }

        return createdOrders;
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) throw err;

      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : 'No stack trace';
      
      this.logger.error(`createOrder failed: ${message}`, stack);
      
      // Provide more context in the error message for better debugging
      throw new InternalServerErrorException(
        `Order placement failed: ${message}`,
      );
    }
  }

  async getUserOrders(userId: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      this.logger.warn(`getUserOrders: Invalid or missing userId: "${userId}"`);
      return [];
    }
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerOrders(sellerId: string) {
    return this.orderRepo.find({
      where: { sellerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerStats(sellerId: string) {
    const orders = await this.orderRepo.find({
      where: { sellerId },
    });

    const totalEarnings = orders
      .filter((o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.PAID || o.status === OrderStatus.APPROVED || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.SHIPPED)
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === OrderStatus.PENDING_STOCK || o.status === OrderStatus.PAYMENT_PENDING || o.status === OrderStatus.PAID,
    ).length;

    // Last 30 days earnings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEarnings = orders
      .filter((o) => o.createdAt >= thirtyDaysAgo && (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.PAID || o.status === OrderStatus.APPROVED || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.SHIPPED))
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      totalEarnings,
      totalOrders,
      pendingOrders,
      recentEarnings,
      orderStatusBreakdown: {
        pending: orders.filter(o => o.status === OrderStatus.PENDING_STOCK || o.status === OrderStatus.PAYMENT_PENDING).length,
        processing: orders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.APPROVED || o.status === OrderStatus.PROCESSING).length,
        shipped: orders.filter(o => o.status === OrderStatus.SHIPPED).length,
        delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REJECTED).length,
      }
    };
  }

  async getOrderById(userId: string, orderId: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!userId || !uuidRegex.test(userId)) {
      this.logger.error(
        `getOrderById: userId is missing or invalid UUID format: "${userId}"`,
      );
      throw new UnprocessableEntityException(
        'User identity not verified or sync pending. Please refresh your session.',
      );
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderTracking(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const history = await this.historyRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });

    return { ...order, history };
  }

  async countAll(): Promise<number> {
    return this.orderRepo.count().catch(() => 0);
  }

  async getTimeline() {
    return this.orderRepo
      .createQueryBuilder('order')
      .select("DATE_TRUNC('day', order.created_at)", 'date')
      .addSelect('COUNT(order.id)', 'count')
      .addSelect('SUM(order.total_amount)', 'amount')
      .groupBy("DATE_TRUNC('day', order.created_at)")
      .orderBy("DATE_TRUNC('day', order.created_at)", 'ASC')
      .getRawMany()
      .then((rows) =>
        rows.map((r) => ({
          date: r.date,
          count: Number(r.count ?? 0),
          amount: Number(r.amount ?? 0),
        })),
      )
      .catch(() => []);
  }

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

    // Validate Status Transitions
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      order.status = newStatus;
      if (newStatus === OrderStatus.REJECTED && reason) {
        order.rejectReason = reason;
      }
      const savedOrder = await manager.save(order);

      const history = manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        status: newStatus,
        reason: reason || `Status updated to ${newStatus}`,
      });
      await manager.save(history);

      // Save Outbox Event for status update
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

  async markOrderAsPaid(orderId: string, paymentId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Idempotency Check: Have we already processed this payment event?
      const alreadyProcessed = await manager.findOne(ProcessedMessage, {
        where: { id: paymentId },
      });

      if (alreadyProcessed) {
        this.logger.info(
          `Idempotency check: Payment event ${paymentId} already processed. Skipping.`,
        );
        return;
      }

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
      } else {
        this.logger.warn(
          `Saga Event Ignored: Order ${orderId} not found or not in PENDING/PAYMENT_PENDING status (current: ${order?.status}).`,
        );
      }

      // Mark the message as processed to ensure exactly-once semantics
      const processed = manager.create(ProcessedMessage, {
        id: paymentId,
        eventType: EVENT_PATTERNS.PAYMENT_SUCCEEDED,
      });
      await manager.save(processed);
    });
  }

  async handleStockReserved(
    orderId: string,
    items: { productId: string; quantity: number }[],
    messageId: string,
  ): Promise<void> {

    await this.dataSource.transaction(async (manager) => {
      const processedRepo = manager.getRepository(ProcessedMessage);
      const alreadyProcessed = await processedRepo.findOne({
        where: { id: messageId },
      });
      if (alreadyProcessed) {
        this.logger.info(
          `Idempotency check: Stock reserved event ${messageId} already processed. Skipping.`,
        );
        return;
      }

      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        this.logger.warn(`handleStockReserved: Order ${orderId} not found`);
        return;
      }

      if (order.status !== OrderStatus.PENDING_STOCK) {
        this.logger.warn(
          `handleStockReserved: Order ${orderId} is not in PENDING_STOCK state (current: ${order.status})`,
        );
        return;
      }

      // Transition Order status to PAYMENT_PENDING
      order.status = OrderStatus.PAYMENT_PENDING;
      const savedOrder = await manager.save(order);

      const history = manager.create(OrderStatusHistory, {
        orderId,
        status: OrderStatus.PAYMENT_PENDING,
        reason: 'Stock successfully reserved, awaiting payment.',
      });
      await manager.save(history);

      // Now emit ORDER_CREATED event so other services (like notifications or payments) can react
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

      const processed = processedRepo.create({
        id: messageId,
        eventType: EVENT_PATTERNS.STOCK_RESERVED,
      });
      await manager.save(processed);

      this.logger.info(`Stock reserved for Order ${orderId}. Transitioned to PAYMENT_PENDING.`);
    });
  }

  async handlePaymentFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const processedRepo = manager.getRepository(ProcessedMessage);
      const alreadyProcessed = await processedRepo.findOne({
        where: { id: messageId },
      });
      if (alreadyProcessed) {
        this.logger.info(`Idempotency check: Payment failure for Order ${orderId} already handled. Skipping.`);
        return;
      }

      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        this.logger.warn(`handlePaymentFailed: Order ${orderId} not found`);
        return;
      }

      if (order.status !== OrderStatus.PAYMENT_PENDING && order.status !== OrderStatus.PENDING_STOCK) {
        this.logger.warn(
          `handlePaymentFailed: Order ${orderId} is not in PAYMENT_PENDING/PENDING_STOCK state (current: ${order.status})`,
        );
        return;
      }

      order.status = OrderStatus.CANCELLED;
      order.rejectReason = reason || 'Payment failed';
      const savedOrder = await manager.save(order);

      const history = manager.create(OrderStatusHistory, {
        orderId,
        status: OrderStatus.CANCELLED,
        reason: `Payment failed: ${order.rejectReason}`,
      });
      await manager.save(history);

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

      const processed = processedRepo.create({
        id: messageId,
        eventType: EVENT_PATTERNS.PAYMENT_FAILED,
      });
      await processedRepo.save(processed);

      this.logger.info(`Payment failed for Order ${orderId}. Transitioned to CANCELLED. Stock release event emitted.`);
    });
  }

  async handleStockReserveFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const processedRepo = manager.getRepository(ProcessedMessage);
      const alreadyProcessed = await processedRepo.findOne({
        where: { id: messageId },
      });
      if (alreadyProcessed) {
        this.logger.info(
          `Idempotency check: Stock reserve failed event ${messageId} already processed. Skipping.`,
        );
        return;
      }

      const order = await manager.findOne(Order, {
        where: { id: orderId },
      });

      if (!order) {
        this.logger.warn(`handleStockReserveFailed: Order ${orderId} not found`);
        return;
      }

      if (order.status !== OrderStatus.PENDING_STOCK) {
        this.logger.warn(
          `handleStockReserveFailed: Order ${orderId} is not in PENDING_STOCK state (current: ${order.status})`,
        );
        return;
      }

      // Transition Order status to STOCK_FAILED
      order.status = OrderStatus.STOCK_FAILED;
      order.rejectReason = reason || 'Insufficient stock';
      const savedOrder = await manager.save(order);

      const history = manager.create(OrderStatusHistory, {
        orderId,
        status: OrderStatus.STOCK_FAILED,
        reason: `Stock reservation failed: ${order.rejectReason}`,
      });
      await manager.save(history);

      const processed = processedRepo.create({
        id: messageId,
        eventType: EVENT_PATTERNS.STOCK_RESERVE_FAILED,
      });
      await manager.save(processed);

      this.logger.info(`Stock reservation failed for Order ${orderId}. Transitioned to STOCK_FAILED.`);
    });
  }

  private isValidTransition(
    current: OrderStatus,
    target: OrderStatus,
  ): boolean {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_STOCK]: [OrderStatus.PAYMENT_PENDING, OrderStatus.STOCK_FAILED, OrderStatus.CANCELLED],
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.STOCK_CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.STOCK_FAILED]: [],
      [OrderStatus.PAID]: [OrderStatus.APPROVED, OrderStatus.REJECTED],
      [OrderStatus.APPROVED]: [OrderStatus.PROCESSING],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.REJECTED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return allowed[current]?.includes(target) ?? false;
  }
}
