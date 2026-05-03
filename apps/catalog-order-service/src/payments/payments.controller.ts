import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { ClerkAuthGuard, CurrentUser } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { CreateIntentDto } from './dto/create-intent.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create-intent')
  @UseGuards(ClerkAuthGuard)
  async createIntent(
    @CurrentUser() user: ClerkUser,
    @Body() body: CreateIntentDto,
  ) {
    const order = await this.ordersService.getOrderById(user.userId, body.orderId);
    return this.paymentsService.createPaymentIntent(Number(order.totalAmount), body.orderId, user.userId);
  }

  @Post('stripe-webhook')
  @HttpCode(200)
  async handleWebhook(@Body() event: any) {
    // Return early to acknowledge receipt to Stripe
    await this.paymentsService.handleStripeWebhook(event);
    return { received: true };
  }
}
