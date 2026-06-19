import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { Payload, Ctx, RmqContext, MessagePattern } from '@nestjs/microservices';
import { PinoLogger, BusinessMetricsService } from '@repo/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ClerkAuthGuard,
  CurrentUser,
  Roles,
  RolesGuard,
  type ClerkUser,
} from '@repo/auth';
import { EVENT_PATTERNS, EventSchemas, OrderStatus } from '@repo/contracts';
import type { PaymentSucceededEvent } from '@repo/contracts';
import { RabbitMQMessageHandler } from '../common/rabbitmq-message-handler.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly ordersService: OrdersService,
    private readonly metrics: BusinessMetricsService,
  ) {}

  @RabbitMQMessageHandler(EVENT_PATTERNS.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(@Payload() data: PaymentSucceededEvent) {
    // Validate schema before processing — prevents broken saga state from malformed payloads
    const parsed = EventSchemas.PaymentSucceeded.safeParse(data);
    if (!parsed.success) {
      this.logger.error(
        `[Schema] Invalid ${EVENT_PATTERNS.PAYMENT_SUCCEEDED} payload: ${parsed.error.message}`,
      );
      this.metrics.dlqMessagesTotal.inc({ service: 'order-service', pattern: EVENT_PATTERNS.PAYMENT_SUCCEEDED });
      return; // ack: don't reprocess permanently-invalid messages
    }

    this.logger.info(`Received PAYMENT_SUCCEEDED RMQ event for Order ${parsed.data.orderId}`);
    await this.ordersService.markOrderAsPaid(parsed.data.orderId, parsed.data.paymentId);
    this.metrics.paymentSuccessTotal.inc({ currency: parsed.data.currency ?? 'INR' });
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.STOCK_RESERVED)
  async handleStockReserved(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[]; reservedAt: string },
    @Ctx() context: RmqContext,
  ) {
    const parsed = EventSchemas.StockReserved.safeParse(data);
    if (!parsed.success) {
      this.logger.error(
        `[Schema] Invalid ${EVENT_PATTERNS.STOCK_RESERVED} payload: ${parsed.error.message}`,
      );
      return;
    }

    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${parsed.data.orderId}:reserved`;
    this.logger.info(
      `Received STOCK_RESERVED RMQ event for Order ${parsed.data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handleStockReserved(parsed.data.orderId, parsed.data.items, messageId);
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.STOCK_RESERVE_FAILED)
  async handleStockReserveFailed(
    @Payload() data: { orderId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    const parsed = EventSchemas.StockReserveFailed.safeParse(data);
    if (!parsed.success) {
      this.logger.error(
        `[Schema] Invalid ${EVENT_PATTERNS.STOCK_RESERVE_FAILED} payload: ${parsed.error.message}`,
      );
      return;
    }

    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${parsed.data.orderId}:reserve-failed`;
    this.logger.info(
      `Received STOCK_RESERVE_FAILED RMQ event for Order ${parsed.data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handleStockReserveFailed(parsed.data.orderId, parsed.data.reason, messageId);
    this.metrics.stockReservationFailuresTotal.inc({ reason: parsed.data.reason?.slice(0, 50) ?? 'unknown' });
    this.metrics.sagaCompensationsTotal.inc({ trigger: 'stock_failed' });
  }

  @RabbitMQMessageHandler(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: { orderId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    const parsed = EventSchemas.PaymentFailed.safeParse(data);
    if (!parsed.success) {
      this.logger.error(
        `[Schema] Invalid ${EVENT_PATTERNS.PAYMENT_FAILED} payload: ${parsed.error.message}`,
      );
      return;
    }

    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${parsed.data.orderId}:payment-failed`;
    this.logger.info(
      `Received PAYMENT_FAILED RMQ event for Order ${parsed.data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handlePaymentFailed(parsed.data.orderId, parsed.data.reason, messageId);
    this.metrics.paymentFailureTotal.inc({ reason: parsed.data.reason?.slice(0, 50) ?? 'unknown' });
    this.metrics.sagaCompensationsTotal.inc({ trigger: 'payment_failed' });
  }

  @MessagePattern('orders.count')
  async countOrders() {
    return this.ordersService.countAll();
  }

  @MessagePattern('orders.timeline')
  async getOrdersTimeline() {
    return this.ordersService.getTimeline();
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createOrder(
    @CurrentUser() user: ClerkUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const orders = await this.ordersService.createOrder(user, createOrderDto);
    return Array.isArray(orders) ? orders[0] : orders;
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  getUserOrders(@CurrentUser() user: ClerkUser) {
    return this.ordersService.getUserOrders(user.internalId);
  }

  @Get('seller/stats')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('SELLER')
  getSellerStats(@CurrentUser() user: ClerkUser) {
    return this.ordersService.getSellerStats(user.userId);
  }

  @Get('seller')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('SELLER')
  getSellerOrders(@CurrentUser() user: ClerkUser) {
    return this.ordersService.getSellerOrders(user.userId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  getOrder(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    return this.ordersService.getOrderById(user.internalId, id);
  }

  @Get(':id/tracking')
  @UseGuards(ClerkAuthGuard)
  getOrderTracking(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    return this.ordersService.getOrderTracking(id, user.internalId);
  }

  @Patch('seller/:id/status')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('SELLER')
  updateStatus(
    @CurrentUser() user: ClerkUser,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; reason?: string },
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      user.userId,
      body.status,
      body.reason,
    );
  }
}
