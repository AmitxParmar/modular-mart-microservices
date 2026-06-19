import { Module } from '@nestjs/common';
import { EventBusModule } from '@repo/common/messaging';

/**
 * MessagingModule for order-service.
 *
 * Replaces the RABBITMQ_SERVICE ClientProxy with EventBusModule.
 * CATALOG_SERVICE, PAYMENT_SERVICE, and AUTH_SERVICE remain as separate RPC
 * clients (request-response pattern) registered in their own module.
 */
@Module({
  imports: [EventBusModule],
  exports: [EventBusModule],
})
export class MessagingModule {}
