import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_PATTERNS, PaymentSucceededEvent } from '@repo/contracts';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { InjectPinoLogger, PinoLogger } from '@repo/common';
import Stripe from 'stripe';
import * as StripeNamespace from 'stripe';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectPinoLogger(PaymentsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    @Inject('STRIPE_CLIENT') private readonly stripe: StripeNamespace.Stripe,
    private readonly configService: ConfigService,
  ) {}

  async createPaymentIntent(amount: number, orderId: string, userId: string) {
    this.logger.info(`Creating PaymentIntent for Order ${orderId}, Amount: ${amount}`);

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

  async handleStripeWebhook(payload: Buffer, signature: string) {
    let event: any;

    try {
      const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }
      event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw err;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const orderId = paymentIntent.metadata.orderId;
      const userId = paymentIntent.metadata.userId;

      if (!orderId) {
        this.logger.warn(
          `Payment succeeded but no orderId found in metadata for intent ${paymentIntent.id}`,
        );
        return;
      }

      // Check if payment record already exists
      const existingPayment = await this.paymentRepo.findOne({ where: { stripePaymentIntentId: paymentIntent.id } });
      if (existingPayment) {
        this.logger.info(`Payment record for intent ${paymentIntent.id} already exists. Skipping.`);
        return;
      }

      // Create Payment Record
      const amountPaid = paymentIntent.amount / 100;

      const payment = this.paymentRepo.create({
        orderId,
        amount: amountPaid,
        status: PaymentStatus.SUCCESS,
        stripePaymentIntentId: paymentIntent.id,
      });
      await this.paymentRepo.save(payment);

      this.logger.info(
        `Payment record created for Order ${orderId}. Publishing RabbitMQ event.`,
      );

      // Publish RabbitMQ Event
      const payload: PaymentSucceededEvent = {
        orderId,
        userId: userId || 'unknown',
        paymentId: payment.id,
        amount: amountPaid,
        currency: 'USD',
        paidAt: new Date().toISOString(),
      };

      this.rabbitClient.emit(EVENT_PATTERNS.PAYMENT_SUCCEEDED, payload);
    }
  }
}
