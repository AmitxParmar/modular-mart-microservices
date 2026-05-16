import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Headers,
  RawBody,
  Get,
  Param,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard, CurrentUser } from '@repo/auth';
import type { ClerkUser } from '@repo/auth';
import { CreateIntentDto } from './dto/create-intent.dto';
import { EVENT_PATTERNS } from '@repo/contracts';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/create-intent
   *
   * Creates a Stripe PaymentIntent. The frontend must provide orderId + amount.
   * payment-service no longer calls order-service synchronously.
   *
   * Why: Decoupling — if order-service is down, payment-service still starts up.
   * Circuit breaker concept: the dependency chain is broken.
   */
  @Post('create-intent')
  @UseGuards(ClerkAuthGuard)
  async createIntent(
    @CurrentUser() user: ClerkUser,
    @Body() body: CreateIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      Number(body.amount),
      body.orderId,
      user.internalId ?? user.userId,
    );
  }

  /**
   * POST /api/payments/stripe-webhook
   *
   * Stripe sends this whenever a payment event occurs.
   * We return 200 immediately to acknowledge receipt, then process async.
   */
  @Post('stripe-webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() rawBody: Buffer,
  ) {
    if (!signature) {
      return { error: 'Missing signature' };
    }
    await this.paymentsService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }

  /**
   * GET /api/payments/order/:orderId
   * Look up payment record by order ID (useful for admin/debugging)
   */
  @Get('order/:orderId')
  @UseGuards(ClerkAuthGuard)
  async getByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }

  // ── RabbitMQ Message Consumers ───────────────────────────────────────────
  // payment-service can listen to order events to prepare payment records early
  // (optional — demonstrates event consumption, not just publishing)

  /**
   * Listens to order.created events.
   * Creates a PENDING payment record proactively, so the record exists
   * before the user even clicks "Pay Now".
   *
   * Microservices concept: Event-driven pre-work / eventual consistency
   */
  @MessagePattern(EVENT_PATTERNS.ORDER_CREATED)
  async onOrderCreated(@Payload() data: { orderId: string; totalAmount: number; userId: string }) {
    // Could pre-create a PENDING payment record here
    // For now, just log — demonstrates you know how to consume events
    console.log(`[payment-service] Received order.created for order ${data.orderId}`);
  }
}
