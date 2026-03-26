import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClerkAuthGuard, CurrentUser } from '@repo/auth';
import { EVENT_PATTERNS } from '@repo/contracts';
import type { PaymentSucceededEvent } from '@repo/contracts';
import type { ClerkUser } from '@repo/auth';

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
    return this.ordersService.createOrder(user.userId, createOrderDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  getUserOrders(@CurrentUser() user: ClerkUser) {
    return this.ordersService.getUserOrders(user.userId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  getOrder(@CurrentUser() user: ClerkUser, @Param('id') id: string) {
    return this.ordersService.getOrderById(user.userId, id);
  }
}
