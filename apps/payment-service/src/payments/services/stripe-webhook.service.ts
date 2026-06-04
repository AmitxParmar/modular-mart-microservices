import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_PATTERNS, PaymentSucceededEvent, PaymentFailedEvent } from '@repo/contracts';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { PinoLogger } from '@repo/common';
import Stripe from 'stripe';

type StripeInstance = InstanceType<typeof Stripe>;
type StripePaymentIntent = Awaited<
  ReturnType<StripeInstance['paymentIntents']['create']>
>;

/**
 * Service responsible for processing specific Stripe webhook events.
 * Decouples event handling logic from the main PaymentsService.
 */
@Injectable()
export class StripeWebhookService {
  constructor(
    private readonly logger: PinoLogger,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  /**
   * Handles the 'payment_intent.succeeded' event.
   * Records the successful payment and notifies the order-service.
   * 
   * @param paymentIntent - The Stripe PaymentIntent object.
   */
  async handlePaymentIntentSucceeded(paymentIntent: StripePaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    const userId = paymentIntent.metadata.userId;

    if (!orderId) {
      this.logger.warn(`Payment succeeded but no orderId found in metadata for intent ${paymentIntent.id}`);
      return;
    }

    // 1. Idempotency Check: Prevent duplicate processing of the same intent
    const existingPayment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (existingPayment) {
      this.logger.info(`Payment record for intent ${paymentIntent.id} already exists. Skipping.`);
      return;
    }

    const amountPaid = paymentIntent.amount / 100;

    // 2. Persist the successful payment record
    const payment = this.paymentRepo.create({
      orderId,
      amount: amountPaid,
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: paymentIntent.id,
    });
    await this.paymentRepo.save(payment);

    this.logger.info(`Payment record created for Order ${orderId}. Publishing success event.`);

    // 3. Emit Saga event for order-service
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

  /**
   * Handles the 'payment_intent.payment_failed' event.
   * Records the failure and notifies the order-service to cancel the order.
   * 
   * @param paymentIntent - The Stripe PaymentIntent object.
   */
  async handlePaymentIntentFailed(paymentIntent: StripePaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    const userId = paymentIntent.metadata.userId;

    if (!orderId) {
      this.logger.warn(`Payment failed but no orderId found in metadata for intent ${paymentIntent.id}`);
      return;
    }

    // 1. Idempotency Check
    const existingFailure = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id, status: PaymentStatus.FAILED },
    });
    if (existingFailure) {
      this.logger.info(`Failed payment record for intent ${paymentIntent.id} already exists. Skipping.`);
      return;
    }

    // 2. Persist the failed payment record
    const payment = this.paymentRepo.create({
      orderId,
      amount: paymentIntent.amount / 100,
      status: PaymentStatus.FAILED,
      stripePaymentIntentId: paymentIntent.id,
    });
    await this.paymentRepo.save(payment);

    this.logger.info(`Payment failure recorded for Order ${orderId}. Publishing failure event.`);

    // 3. Emit Saga event for order-service to trigger rollback/cancellation
    const failurePayload: PaymentFailedEvent = {
      orderId,
      userId: userId || 'unknown',
      reason: paymentIntent.last_payment_error?.message || 'Payment declined',
      failedAt: new Date().toISOString(),
    };

    this.rabbitClient.emit(EVENT_PATTERNS.PAYMENT_FAILED, failurePayload);
  }
}
