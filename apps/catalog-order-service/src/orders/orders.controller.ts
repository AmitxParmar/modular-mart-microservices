import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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
    await this.ordersService.markOrderAsPaid(data.orderId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  createOrder(
    @CurrentUser() user: ClerkUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user, createOrderDto);
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
