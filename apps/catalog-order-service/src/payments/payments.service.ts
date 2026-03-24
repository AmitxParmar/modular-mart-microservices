import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  async handleStripeWebhook(event: any) {
    // In a real scenario, you verify the Stripe signature securely here
    // using stripe.webhooks.constructEvent(...)
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      if (!orderId) {
        this.logger.warn(`Payment succeeded but no orderId found in metadata for intent ${paymentIntent.id}`);
        return;
      }

      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found for payment update');

      // Update Order Status
      order.status = OrderStatus.PAID;
      await this.orderRepo.save(order);

      // Create Payment Record
      const payment = this.paymentRepo.create({
        orderId: order.id,
        amount: order.totalAmount, // Usually matches paymentIntent.amount / 100
        status: PaymentStatus.SUCCESS,
        stripePaymentIntentId: paymentIntent.id,
      });
      await this.paymentRepo.save(payment);

      this.logger.log(`Order ${order.id} marked as PAID. Publishing RabbitMQ event.`);

      // Publish RabbitMQ Event to notification-service
      this.rabbitClient.emit('order_paid', {
        orderId: order.id,
        userId: order.userId,
        amount: order.totalAmount,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
