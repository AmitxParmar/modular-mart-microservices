import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_PATTERNS, PaymentSucceededEvent } from '@repo/contracts';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { InjectPinoLogger, PinoLogger } from '@repo/common';
import Stripe from 'stripe';

type StripeInstance = InstanceType<typeof Stripe>;
type StripeEvent = ReturnType<StripeInstance['webhooks']['constructEvent']>;
type StripePaymentIntent = Awaited<
  ReturnType<StripeInstance['paymentIntents']['create']>
>;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectPinoLogger(PaymentsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    @Inject('STRIPE_CLIENT') private readonly stripe: StripeInstance,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a Stripe PaymentIntent.
   * Amount is provided directly — payment-service no longer queries order-service.
   * This removes the synchronous coupling between the two services.
   */
  async createPaymentIntent(amount: number, orderId: string, userId: string) {
    this.logger.info(
      `Creating PaymentIntent for Order ${orderId}, Amount: ${amount}`,
    );

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId,
        userId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Handles Stripe webhook events.
   * On payment_intent.succeeded:
   *  1. Creates a Payment record in payment_db
   *  2. Publishes payment.succeeded to RabbitMQ
   *     → order-service listens and marks the order as PAID
   *
   * This is the Choreography Saga pattern:
   *  payment-service emits an event → order-service reacts
   *  No direct HTTP call needed between the two services.
   */
  async handleStripeWebhook(payload: Buffer, signature: string) {
    let stripeEvent: StripeEvent;

    try {
      const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }
      stripeEvent = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret,
      );
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw err;
    }

    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object as StripePaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      const userId = paymentIntent.metadata.userId;

      if (!orderId) {
        this.logger.warn(
          `Payment succeeded but no orderId found in metadata for intent ${paymentIntent.id}`,
        );
        return;
      }

      // ── Idempotency guard ────────────────────────────────────────────────
      // If Stripe sends the same webhook twice (which it does on retries),
      // we don't create a duplicate record or emit a duplicate event.
      const existingPayment = await this.paymentRepo.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      });
      if (existingPayment) {
        this.logger.info(
          `Payment record for intent ${paymentIntent.id} already exists. Skipping (idempotent).`,
        );
        return;
      }

      const amountPaid = paymentIntent.amount / 100;

      const payment = this.paymentRepo.create({
        orderId,
        amount: amountPaid,
        status: PaymentStatus.SUCCESS,
        stripePaymentIntentId: paymentIntent.id,
      });
      await this.paymentRepo.save(payment);

      this.logger.info(
        `Payment record created for Order ${orderId}. Publishing ${EVENT_PATTERNS.PAYMENT_SUCCEEDED} event.`,
      );

      // ── Publish event (Saga step) ────────────────────────────────────────
      // order-service subscribes to this event and marks the order as PAID.
      const eventPayload: PaymentSucceededEvent = {
        orderId,
        userId: userId || 'unknown',
        paymentId: payment.id,
        amount: amountPaid,
        currency: 'USD',
        paidAt: new Date().toISOString(),
      };

      this.rabbitClient.emit(EVENT_PATTERNS.PAYMENT_SUCCEEDED, eventPayload);
    }
  }

  async getPaymentByOrderId(orderId: string) {
    return this.paymentRepo.findOne({ where: { orderId } });
  }
}
