import { Module } from '@nestjs/common';
import { EventBusModule } from '@repo/common/messaging';

/**
 * MessagingModule for catalog-service.
 *
 * Previously registered two separate ClientProxy tokens (ORDER_SERVICE and
 * RABBITMQ_SERVICE) both pointing to the same queue — two TCP connections for
 * the same job.  EventBusModule provides a single 'RMQ_EVENT_BUS' connection
 * for all fire-and-forget event publishing.
 *
 * Note: ORDER_SERVICE and AUTH_SERVICE are RPC clients (request-response) and
 * are registered separately in catalog.module.ts — they are NOT replaced here.
 */
@Module({
  imports: [EventBusModule],
  exports: [EventBusModule],
})
export class MessagingModule {}
