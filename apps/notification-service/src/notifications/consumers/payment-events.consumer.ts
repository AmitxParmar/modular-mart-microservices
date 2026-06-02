import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from '../notifications.service';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { EVENT_PATTERNS } from '@repo/contracts';

/**
 * Consumer for Payment-related events from RabbitMQ.
 * Handles events like PAYMENT_SUCCEEDED and PAYMENT_FAILED.
 */
@Injectable()
export class PaymentEventsConsumer {
  private readonly logger = new Logger(PaymentEventsConsumer.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
  ) {}

  /**
   * Listens for PAYMENT_SUCCEEDED events.
   * Priority: HIGH
   */
  @EventPattern(EVENT_PATTERNS.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(
    @Payload() data: any, // Use interface from contracts if available
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.log(`💰 Received PAYMENT_SUCCEEDED event for user ${data.userId}`);

    if (await this.isAlreadyProcessed(messageId)) return;

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.PAYMENT_SUCCEEDED,
      priority: NotificationPriority.HIGH,
      subject: 'Payment Successful',
      content: `Your payment for order #${data.orderId} was successful.`,
      metadata: {
        orderId: data.orderId,
        amount: data.amount,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.PAYMENT_SUCCEEDED);
  }

  /**
   * Listens for PAYMENT_FAILED events.
   * Priority: CRITICAL
   */
  @EventPattern(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.log(`❌ Received PAYMENT_FAILED event for user ${data.userId}`);

    if (await this.isAlreadyProcessed(messageId)) return;

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.PAYMENT_FAILED,
      priority: NotificationPriority.CRITICAL,
      subject: 'Payment Failed',
      content: `We couldn't process your payment for order #${data.orderId}. Please try again.`,
      metadata: {
        orderId: data.orderId,
        error: data.error,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.PAYMENT_FAILED);
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
