import { Module } from '@nestjs/common';
import { EventBusModule } from '@repo/common/messaging';

/**
 * MessagingModule for payment-service.
 *
 * payment-service PUBLISHES: payment.succeeded.v1 / payment.failed.v1
 * payment-service CONSUMES:  payment.events (connected in main.ts via bootstrapMessaging)
 */
@Module({
  imports: [EventBusModule],
  exports: [EventBusModule],
})
export class MessagingModule {}
