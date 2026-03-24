import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe-webhook')
  @HttpCode(200)
  async handleWebhook(@Body() event: any) {
    // Return early to acknowledge receipt to Stripe
    await this.paymentsService.handleStripeWebhook(event);
    return { received: true };
  }
}
