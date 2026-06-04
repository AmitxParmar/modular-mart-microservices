import { 
  Injectable, 
  NotFoundException, 
  InternalServerErrorException, 
  UnprocessableEntityException, 
  Inject 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ClerkUser } from '@repo/auth';
import { OrderStatus, EVENT_PATTERNS } from '@repo/contracts';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

/**
 * Service responsible for the core logic of creating new orders.
 * Handles user identity resolution, product verification, and multi-seller order partitioning.
 */
@Injectable()
export class OrderCreationService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('CATALOG_SERVICE') private readonly catalogClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Orchestrates the creation of one or more orders from a user's request.
   * Group items by seller and creates a separate order for each.
   * 
   * @param user - The authenticated ClerkUser.
   * @param createOrderDto - The order details from the client.
   * @returns A promise that resolves to an array of created Order objects.
   */
  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    // 1. Resolve the internal user ID (fallback to auth-service if missing in token)
    let internalId = user.internalId || createOrderDto.userId;

    if (!internalId) {
      this.logger.info(`createOrder: Missing internalId for user ${user.userId}. Attempting fallback.`);
      try {
        const response = await firstValueFrom(
          this.authClient.send(
            { cmd: EVENT_PATTERNS.GET_USER_ID },
            { clerkId: user.userId },
          ),
        );
        if (response?.internalId) internalId = response.internalId;
      } catch (error) {
        this.logger.error(`createOrder: Fallback internalId resolution failed: ${error.message}`);
      }
    }

    if (!internalId) {
      throw new UnprocessableEntityException(
        'Your account has not finished setting up. Please try again in a moment or contact support.',
      );
    }

    try {
      // 2. Fetch product details from catalog-service to verify existence and get pricing/seller info
      const productIds = createOrderDto.items.map((i) => i.productId);
      const products: any[] = await firstValueFrom(
        this.catalogClient.send<any[]>('products.get_batch', productIds).pipe(timeout(5000))
      );

      // 3. Process the orders within a single transaction to ensure consistency across multiple seller orders
      return await this.dataSource.transaction(async (manager) => {
        // Group items by sellerId
        const itemsBySeller: Record<string, { product: any; quantity: number }[]> = {};

        for (const item of createOrderDto.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new NotFoundException(`Product with ID ${item.productId} not found`);
          
          const sellerId = product.sellerId || 'PLATFORM';
          if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
          itemsBySeller[sellerId].push({ product, quantity: item.quantity });
        }

        const createdOrders: Order[] = [];

        // Create an individual order for each seller
        for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
          let totalAmount = 0;
          const orderItems: OrderItem[] = [];

          // Create order items and calculate totals
          for (const item of sellerItems) {
            const unitPrice = Number(item.product.price);
            totalAmount += unitPrice * item.quantity;
            orderItems.push(manager.create(OrderItem, {
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice,
            }));
          }

          // Initialize the order in PENDING_STOCK state
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

          // Record initial status in history
          await manager.save(manager.create(OrderStatusHistory, {
            orderId: savedOrder.id,
            status: OrderStatus.PENDING_STOCK,
            reason: 'Order created in pending stock state',
          }));

          createdOrders.push(savedOrder);

          // 4. Generate Outbox Event to trigger stock reservation in catalog-service
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
        }

        return createdOrders;
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'status' in err) throw err;
      
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`createOrder failed: ${message}`);
      
      throw new InternalServerErrorException(`Order placement failed: ${message}`);
    }
  }
}
