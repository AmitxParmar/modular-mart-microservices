import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from '../notifications.service';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { EVENT_PATTERNS, OrderCreatedEvent, OrderCancelledEvent } from '@repo/contracts';

/**
 * Consumer for Order-related events from RabbitMQ.
 * Handles events like ORDER_CREATED and ORDER_CANCELLED.
 */
@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
  ) {}

  /**
   * Listens for ORDER_CREATED events.
   * Priority: HIGH
   */
  @EventPattern(EVENT_PATTERNS.ORDER_CREATED)
  async handleOrderCreated(
    @Payload() data: OrderCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.log(`📦 Received ORDER_CREATED event for order ${data.orderId}`);

    // 1. Idempotency Check: Ensure we haven't processed this message ID before
    if (await this.isAlreadyProcessed(messageId)) {
      this.logger.warn(`⚠️ Message ${messageId} already processed. Skipping.`);
      return;
    }

    // 2. Map event to notification
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

    // 3. Mark message as processed
    await this.markAsProcessed(messageId, EVENT_PATTERNS.ORDER_CREATED);
    
    // 4. Acknowledge message (NestJS does this automatically if configured, 
    // but we can do it manually if we disable noAck)
  }

  /**
   * Listens for ORDER_CANCELLED events.
   * Priority: CRITICAL
   */
  @EventPattern(EVENT_PATTERNS.ORDER_CANCELLED)
  async handleOrderCancelled(
    @Payload() data: OrderCancelledEvent,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.log(`🚫 Received ORDER_CANCELLED event for order ${data.orderId}`);

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

  /**
   * Helper to check if a message has already been processed.
   */
  private async isAlreadyProcessed(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    const exists = await this.processedMessageRepository.findOne({
      where: { messageId },
    });
    return !!exists;
  }

  /**
   * Helper to mark a message as processed in the database.
   */
  private async markAsProcessed(messageId: string, eventType: string): Promise<void> {
    if (!messageId) return;
    const processed = this.processedMessageRepository.create({
      messageId,
      eventType,
    });
    await this.processedMessageRepository.save(processed);
  }
}
