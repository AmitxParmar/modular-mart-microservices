import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';
import { NotificationsService } from '../notifications.service';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { EVENT_PATTERNS, OrderCreatedEvent, OrderCancelledEvent } from '@repo/contracts';

/**
 * Consumer for Order-related events from RabbitMQ.
 */
@Injectable()
export class OrderEventsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrderEventsConsumer.name);
  }

  @EventPattern(EVENT_PATTERNS.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() data: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`📦 Received ORDER_CREATED event for order ${data.orderId}`);

    if (await this.isAlreadyProcessed(messageId)) {
      this.logger.warn(`⚠️ Message ${messageId} already processed. Skipping.`);
      return;
    }

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.ORDER_CREATED,
      priority: NotificationPriority.HIGH,
      subject: 'Order Confirmed!',
      content: `Your order #${data.orderId} has been successfully placed.`,
      metadata: {
        orderId: data.orderId,
        totalAmount: data.totalAmount,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.ORDER_CREATED);
  }

  @EventPattern(EVENT_PATTERNS.ORDER_CANCELLED)
  async handleOrderCancelled(
    @Payload() data: OrderCancelledEvent,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`🚫 Received ORDER_CANCELLED event for order ${data.orderId}`);

    if (await this.isAlreadyProcessed(messageId)) return;

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.ORDER_CANCELLED,
      priority: NotificationPriority.CRITICAL,
      subject: 'Order Cancelled',
      content: `Your order #${data.orderId} has been cancelled.`,
      metadata: {
        orderId: data.orderId,
        reason: data.reason,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.ORDER_CANCELLED);
  }

  private async isAlreadyProcessed(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    const exists = await this.processedMessageRepository.findOne({
      where: { messageId },
    });
    return !!exists;
  }

  private async markAsProcessed(messageId: string, eventType: string): Promise<void> {
    if (!messageId) return;
    await this.processedMessageRepository.save({ messageId, eventType });
  }
}
