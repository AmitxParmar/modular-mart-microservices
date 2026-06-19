import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException, 
  UnprocessableEntityException, 
  Inject 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLogger, ServiceClient, BusinessMetricsService } from '@repo/common';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ClerkUser } from '@repo/auth';
import { OrderStatus, EVENT_PATTERNS } from '@repo/contracts';
import { ClientProxy } from '@nestjs/microservices';
import type { GetUserIdResponse } from '@repo/contracts';

/**
 * Service responsible for the core logic of creating new orders.
 * Handles user identity resolution, product verification, and multi-seller order partitioning.
 *
 * All inter-service calls go through ServiceClient which provides:
 *   - Mandatory timeout (10s, accommodates Render cold starts)
 *   - Circuit breaker (opens after 5 consecutive TransientErrors)
 *   - Exponential backoff retry (1s → 2s → 4s, transient-only)
 */
@Injectable()
export class OrderCreationService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientProxy,
    private readonly dataSource: DataSource,
    private readonly serviceClient: ServiceClient,
    private readonly metrics: BusinessMetricsService,
  ) {}

  /**
   * Orchestrates the creation of one or more orders from a user's request.
   * Groups items by seller and creates a separate order for each.
   */
  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    // 1. Resolve the internal user ID (fallback to auth-service if missing in token)
    let internalId = user.internalId || createOrderDto.userId;

    if (!internalId) {
      this.logger.info(`createOrder: Missing internalId for user ${user.userId}. Attempting fallback.`);
      try {
        // Previously: no timeout, no circuit breaker — could hang forever on Render.
        // Now: ServiceClient enforces 10s timeout + circuit breaker + retry.
        const response = await this.serviceClient.send<GetUserIdResponse>(
          'auth-service',
          this.authClient,
          { cmd: EVENT_PATTERNS.GET_USER_ID },
          { clerkId: user.userId },
          { timeoutMs: 5000, retryAttempts: 2 },
        );
        if (response?.internalId) internalId = response.internalId;
      } catch (error) {
        this.logger.error(`createOrder: Fallback internalId resolution failed: ${(error as Error).message}`);
        // Non-fatal: fall through to the check below
      }
    }

    if (!internalId) {
      this.metrics.ordersFailedTotal.inc({ reason: 'missing_internal_id' });
      throw new UnprocessableEntityException(
        'Your account has not finished setting up. Please try again in a moment or contact support.',
      );
    }

    try {
      // 2. Fetch product details from catalog-service (protected by circuit breaker + timeout)
      const productIds = createOrderDto.items.map((i) => i.productId);
      const products = await this.serviceClient.send<any[]>(
        'catalog-service',
        this.catalogClient,
        'products.get_batch',
        productIds,
        { timeoutMs: 8000 },
      );

      // 3. Process the orders within a single transaction
      const createdOrders = await this.dataSource.transaction(async (manager) => {
        // Group items by sellerId
        const itemsBySeller: Record<string, { product: any; quantity: number }[]> = {};

        for (const item of createOrderDto.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new NotFoundException(`Product with ID ${item.productId} not found`);
          
          const sellerId = product.sellerId || 'PLATFORM';
          if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
          itemsBySeller[sellerId].push({ product, quantity: item.quantity });
        }

        const created: Order[] = [];

        for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
          let totalAmount = 0;
          const orderItems: OrderItem[] = [];

          for (const item of sellerItems) {
            const unitPrice = Number(item.product.price);
            totalAmount += unitPrice * item.quantity;
            orderItems.push(manager.create(OrderItem, {
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice,
            }));
          }

          const order = manager.create(Order, {
            userId: internalId,
            sellerId,
            customerEmailSnapshot: user.email ?? null,
            status: OrderStatus.PENDING_STOCK,
            totalAmount,
            shippingAddressId: createOrderDto.shippingAddressId ?? undefined,
            shippingAddressSnapshot: createOrderDto.shippingAddressSnapshot ?? undefined,
            items: orderItems,
          });

          const savedOrder = await manager.save(order);

          await manager.save(manager.create(OrderStatusHistory, {
            orderId: savedOrder.id,
            status: OrderStatus.PENDING_STOCK,
            reason: 'Order created in pending stock state',
          }));

          created.push(savedOrder);

          // 4. Generate Outbox Event for stock reservation saga
          await manager.save(manager.create(OutboxEvent, {
            eventType: EVENT_PATTERNS.STOCK_RESERVE_REQUESTED,
            payload: {
              orderId: savedOrder.id,
              items: sellerItems.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
              })),
            },
          }));

          // Track successful order creation
          this.metrics.ordersCreatedTotal.inc({ sellerId });
        }

        return created;
      });

      return createdOrders;
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) throw err;
      
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`createOrder failed: ${message}`);
      this.metrics.ordersFailedTotal.inc({ reason: 'internal_error' });
      
      throw new InternalServerErrorException(`Order placement failed: ${message}`);
    }
  }
}
