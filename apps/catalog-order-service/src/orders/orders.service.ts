import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../catalog/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClerkUser } from '@repo/auth';

@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    // Resolve Identity: Prioritize the verified JWT claim, fallback to client-provided ID
    // (Note: In production, you'd ideally verify the fallback against the DB if security is critical)
    const internalId = user.internalId || createOrderDto.userId;

    if (!internalId) {
      this.logger.warn(`createOrder: No internalId found for Clerk User ${user.userId}`);
      throw new UnprocessableEntityException(
        'Your account has not finished setting up. Please try again in a moment or contact support.',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        let totalAmount = 0;
        const orderItemsToSave: OrderItem[] = [];

        for (const item of createOrderDto.items) {
          // Lock product row to prevent race conditions during concurrent checkouts
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

          product.stockQuantity -= item.quantity;
          await manager.save(product);

          const unitPrice = Number(product.price);
          totalAmount += unitPrice * item.quantity;

          const orderItem = manager.create(OrderItem, {
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
          });
          orderItemsToSave.push(orderItem);
        }

        // Address snapshot is provided by the client at checkout time.
        // No cross-service HTTP call is needed — the frontend already has
        // this data from the shipping form the user just filled out.
        const order = manager.create(Order, {
          userId: internalId,
          customerEmailSnapshot: user.email ?? null,
          status: OrderStatus.PENDING,
          totalAmount,
          shippingAddressId: createOrderDto.shippingAddressId ?? undefined,
          shippingAddressSnapshot: createOrderDto.shippingAddressSnapshot ?? undefined,
          items: orderItemsToSave,
        });

        return await manager.save(order);
      });
    } catch (err: unknown) {
      // Re-throw NestJS HTTP exceptions as-is (NotFoundException, BadRequestException, etc.)
      if (err instanceof Error && 'status' in err) throw err;

      // Otherwise log and wrap raw DB / unexpected errors
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`createOrder failed: ${message}`);
      throw new InternalServerErrorException(
        'An unexpected error occurred while placing your order. Please try again.',
      );
    }
  }

  async getUserOrders(userId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

  async getOrderById(userId: string, orderId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!userId || !uuidRegex.test(userId)) {
      this.logger.error(`getOrderById: userId is missing or invalid UUID format: "${userId}"`);
      throw new UnprocessableEntityException('User identity not verified or sync pending. Please refresh your session.');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'items.product'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async markOrderAsPaid(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (order?.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
      await this.orderRepo.save(order);
      this.logger.info(
        `Saga Event Processed: Order ${orderId} successfully marked as PAID.`,
      );
    } else {
      this.logger.warn(
        `Saga Event Ignored: Order ${orderId} not found or not in PENDING status.`,
      );
    }
  }
}
