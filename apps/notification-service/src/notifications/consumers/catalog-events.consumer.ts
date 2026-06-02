import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';
import { NotificationsService } from '../notifications.service';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { EVENT_PATTERNS } from '@repo/contracts';

/**
 * Consumer for Catalog-related events from RabbitMQ.
 */
@Injectable()
export class CatalogEventsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogEventsConsumer.name);
  }

  @EventPattern(EVENT_PATTERNS.STOCK_RESERVE_FAILED)
  async handleStockReserveFailed(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`⚠️ Received STOCK_RESERVE_FAILED event for order ${data.orderId}`);

    if (await this.isAlreadyProcessed(messageId)) return;

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.HIGH,
      subject: 'Order Issue: Out of Stock',
      content: `We're sorry, but items in your order #${data.orderId} are no longer available.`,
      metadata: {
        orderId: data.orderId,
        productId: data.productId,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.STOCK_RESERVE_FAILED);
  }

  private async isAlreadyProcessed(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    const exists = await this.processedMessageRepository.findOne({ where: { messageId } });
    return !!exists;
  }

  private async markAsProcessed(messageId: string, eventType: string): Promise<void> {
    if (!messageId) return;
    await this.processedMessageRepository.save({ messageId, eventType });
  }
}
