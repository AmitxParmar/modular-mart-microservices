import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ClerkAuthGuard,
  CurrentUser,
  Roles,
  RolesGuard,
  type ClerkUser,
} from '@repo/auth';
import { EVENT_PATTERNS, OrderStatus } from '@repo/contracts';
import type { PaymentSucceededEvent } from '@repo/contracts';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly ordersService: OrdersService,
  ) {}

  @EventPattern(EVENT_PATTERNS.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(@Payload() data: PaymentSucceededEvent) {
    this.logger.info(
      `Received PAYMENT_SUCCEEDED RMQ event for Order ${data.orderId}`,
    );
    await this.ordersService.markOrderAsPaid(data.orderId, data.paymentId);
  }

  @EventPattern(EVENT_PATTERNS.STOCK_RESERVED)
  async handleStockReserved(
    @Payload() data: { orderId: string; items: { productId: string; quantity: number }[] },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:reserved`;
    this.logger.info(
      `Received STOCK_RESERVED RMQ event for Order ${data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handleStockReserved(data.orderId, data.items, messageId);
  }

  @EventPattern(EVENT_PATTERNS.STOCK_RESERVE_FAILED)
  async handleStockReserveFailed(
    @Payload() data: { orderId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:reserve-failed`;
    this.logger.info(
      `Received STOCK_RESERVE_FAILED RMQ event for Order ${data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handleStockReserveFailed(data.orderId, data.reason, messageId);
  }

  @EventPattern(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: { orderId: string; reason: string },
    @Ctx() context: RmqContext,
  ) {
    const message = context.getMessage();
    const messageId = message?.properties?.messageId || `${data.orderId}:payment-failed`;
    this.logger.info(
      `Received PAYMENT_FAILED RMQ event for Order ${data.orderId} (messageId: ${messageId})`,
    );
    await this.ordersService.handlePaymentFailed(data.orderId, data.reason, messageId);
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

  @Get('seller')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('SELLER')
  getSellerOrders(@CurrentUser() user: ClerkUser) {
    return this.ordersService.getSellerOrders(user.internalId);
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
      user.internalId,
      body.status,
      body.reason,
    );
  }
}
