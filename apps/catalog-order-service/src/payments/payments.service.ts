import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { EVENT_PATTERNS, PaymentSucceededEvent } from '@repo/contracts';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { InjectPinoLogger, PinoLogger } from '@repo/common';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectPinoLogger(PaymentsService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  async handleStripeWebhook(event: any) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      const userId = paymentIntent.metadata.userId; // Assuming userId is passed via metadata

      if (!orderId) {
        this.logger.warn(
          `Payment succeeded but no orderId found in metadata for intent ${paymentIntent.id}`,
        );
        return;
      }

      // Create Payment Record (Independent domain)
      const amountPaid = paymentIntent.amount / 100; // Stripe defaults to cents

      const payment = this.paymentRepo.create({
        orderId,
        amount: amountPaid,
        status: PaymentStatus.SUCCESS,
        stripePaymentIntentId: paymentIntent.id,
      });
      await this.paymentRepo.save(payment);

      this.logger.info(
        `Payment record created for Order ${orderId}. Publishing RabbitMQ event for Saga choreography.`,
      );

      // Publish RabbitMQ Event via Contracts
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
