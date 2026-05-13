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
import { Product } from '../catalog/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClerkUser } from '@repo/auth';
import { OrderStatus, EVENT_PATTERNS } from '@repo/contracts';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    const internalId = user.internalId || createOrderDto.userId;

    if (!internalId) {
      this.logger.warn(
        `createOrder: No internalId found for Clerk User ${user.userId}`,
      );
      throw new UnprocessableEntityException(
        'Your account has not finished setting up. Please try again in a moment or contact support.',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // 1. Group requested items by seller
        const itemsBySeller: Record<
          string,
          { product: Product; quantity: number }[]
        > = {};

        for (const item of createOrderDto.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }

          if (product.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}`,
            );
          }

          // Deduct stock
          product.stockQuantity -= item.quantity;
          await manager.save(product);

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
            status: OrderStatus.PENDING,
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
            status: OrderStatus.PENDING,
            reason: 'Order created',
          });
          await manager.save(history);

          createdOrders.push(savedOrder);

          // 4. Publish Event
          this.rabbitClient.emit(EVENT_PATTERNS.ORDER_CREATED, {
            orderId: savedOrder.id,
            userId: internalId,
            sellerId,
            totalAmount,
            createdAt: savedOrder.createdAt,
          });
        }

        return createdOrders;
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) throw err;

      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`createOrder failed: ${message}`);
      throw new InternalServerErrorException(
        'An unexpected error occurred while placing your order.',
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
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerOrders(sellerId: string) {
    return this.orderRepo.find({
      where: { sellerId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
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
      relations: ['items', 'items.product'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderTracking(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'items.product'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const history = await this.historyRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });

    return { ...order, history };
  }

  async updateOrderStatus(
    orderId: string,
    sellerId: string,
    newStatus: OrderStatus,
    reason?: string,
  ) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, sellerId },
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

      // Publish RabbitMQ Event
      this.rabbitClient.emit(EVENT_PATTERNS.ORDER_STATUS_UPDATED, {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        previousStatus: currentStatus,
        newStatus,
        reason,
        updatedAt: new Date().toISOString(),
      });

      if (newStatus === OrderStatus.APPROVED) {
        this.rabbitClient.emit(EVENT_PATTERNS.ORDER_APPROVED, {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          sellerId: savedOrder.sellerId,
          approvedAt: new Date().toISOString(),
        });
      } else if (newStatus === OrderStatus.REJECTED) {
        this.rabbitClient.emit(EVENT_PATTERNS.ORDER_REJECTED, {
          orderId: savedOrder.id,
          userId: savedOrder.userId,
          sellerId: savedOrder.sellerId,
          reason: reason || 'No reason provided',
          rejectedAt: new Date().toISOString(),
        });
      }

      return savedOrder;
    });
  }

  async markOrderAsPaid(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (order?.status === OrderStatus.PENDING) {
      await this.dataSource.transaction(async (manager) => {
        order.status = OrderStatus.PAID;
        await manager.save(order);

        const history = manager.create(OrderStatusHistory, {
          orderId,
          status: OrderStatus.PAID,
          reason: 'Payment successful',
        });
        await manager.save(history);
      });

      this.logger.info(
        `Saga Event Processed: Order ${orderId} successfully marked as PAID.`,
      );
    } else {
      this.logger.warn(
        `Saga Event Ignored: Order ${orderId} not found or not in PENDING status.`,
      );
    }
  }

  private isValidTransition(
    current: OrderStatus,
    target: OrderStatus,
  ): boolean {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
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
