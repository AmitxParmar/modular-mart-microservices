import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PinoLogger } from '@repo/common';
import Stripe from 'stripe';
import { StripeWebhookService } from './services/stripe-webhook.service';

type StripeInstance = InstanceType<typeof Stripe>;
type StripeEvent = ReturnType<StripeInstance['webhooks']['constructEvent']>;
type StripePaymentIntent = Awaited<
  ReturnType<StripeInstance['paymentIntents']['create']>
>;

/**
 * Service responsible for managing payments and Stripe integration.
 */
@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject('STRIPE_CLIENT') private readonly stripe: StripeInstance,
    private readonly configService: ConfigService,
    private readonly webhookService: StripeWebhookService,
  ) {}

  onModuleInit() {
    this.logger.setContext(PaymentsService.name);
  }

  /**
   * Creates a Stripe PaymentIntent for a specific order.
   * 
   * @param amount - The total amount to charge.
   * @param orderId - The ID of the order being paid for.
   * @param userId - The ID of the user placing the order.
   * @returns An object containing the client secret for frontend integration.
   */
  async createPaymentIntent(amount: number, orderId: string, userId: string) {
    this.logger.info(`Creating PaymentIntent for Order ${orderId}, Amount: ${amount}`);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { orderId, userId },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Main entry point for Stripe webhooks.
   * Handles signature verification and dispatches events to specialized handlers.
   * 
   * @param payload - Raw request body buffer.
   * @param signature - stripe-signature header.
   */
  async handleStripeWebhook(payload: Buffer, signature: string) {
    let stripeEvent: StripeEvent;

    // 1. Verify the webhook signature
    try {
      const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      
      stripeEvent = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw err;
    }

    // 2. Dispatch to specialized event handlers
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await this.webhookService.handlePaymentIntentSucceeded(stripeEvent.data.object as StripePaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await this.webhookService.handlePaymentIntentFailed(stripeEvent.data.object as StripePaymentIntent);
        break;

      default:
        this.logger.debug(`Unhandled Stripe event type: ${stripeEvent.type}`);
    }
  }

  /**
   * Fetches the payment record for a given order.
   */
  async getPaymentByOrderId(orderId: string) {
    return this.paymentRepo.findOne({ where: { orderId } });
  }
}
