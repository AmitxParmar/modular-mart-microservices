import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from '@repo/common';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClerkUser } from '@repo/auth';
import { OrderStatus } from '@repo/contracts';
import { OrderCreationService } from './services/order-creation.service';
import { OrderAnalyticsService } from './services/order-analytics.service';
import { OrderEventsService } from './services/order-events.service';

/**
 * Coordinator service for order management.
 * Acts as a facade that delegates specific domain logic to specialized sub-services.
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly creationService: OrderCreationService,
    private readonly analyticsService: OrderAnalyticsService,
    private readonly eventsService: OrderEventsService,
  ) {}

  /**
   * Delegates order creation to OrderCreationService.
   */
  async createOrder(user: ClerkUser, createOrderDto: CreateOrderDto) {
    return this.creationService.createOrder(user, createOrderDto);
  }

  /**
   * Fetches all orders for a specific user.
   */
  async getUserOrders(userId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; // Simplified for check
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fetches all orders for a specific seller.
   */
  async getSellerOrders(sellerId: string) {
    return this.orderRepo.find({
      where: { sellerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delegates seller statistics calculation to OrderAnalyticsService.
   */
  async getSellerStats(sellerId: string) {
    return this.analyticsService.getSellerStats(sellerId);
  }

  /**
   * Fetches a specific order by ID and verifies user ownership.
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Fetches order tracking info, including its full status history.
   * Coordinates between orderRepo and AnalyticsService.
   */
  async getOrderTracking(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId },
      relations: ['items'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const history = await this.analyticsService.getOrderHistory(orderId);
    return { ...order, history };
  }

  /**
   * Delegates order count calculation to OrderAnalyticsService.
   */
  async countAll(): Promise<number> {
    return this.analyticsService.countAll();
  }

  /**
   * Delegates timeline generation to OrderAnalyticsService.
   */
  async getTimeline() {
    return this.analyticsService.getTimeline();
  }

  /**
   * Delegates status update to OrderEventsService.
   */
  async updateOrderStatus(
    orderId: string,
    sellerId: string,
    newStatus: OrderStatus,
    reason?: string,
  ) {
    return this.eventsService.updateOrderStatus(orderId, sellerId, newStatus, reason);
  }

  /**
   * Delegates payment marking to OrderEventsService.
   */
  async markOrderAsPaid(orderId: string, paymentId: string): Promise<void> {
    return this.eventsService.markOrderAsPaid(orderId, paymentId);
  }

  /**
   * Handles stock reserved event via OrderEventsService.
   */
  async handleStockReserved(
    orderId: string,
    items: { productId: string; quantity: number }[],
    messageId: string,
  ): Promise<void> {
    return this.eventsService.handleStockReserved(orderId, items, messageId);
  }

  /**
   * Handles payment failure event via OrderEventsService.
   */
  async handlePaymentFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    return this.eventsService.handlePaymentFailed(orderId, reason, messageId);
  }

  /**
   * Handles stock reserve failure event via OrderEventsService.
   */
  async handleStockReserveFailed(orderId: string, reason: string, messageId: string): Promise<void> {
    return this.eventsService.handleStockReserveFailed(orderId, reason, messageId);
  }
}
