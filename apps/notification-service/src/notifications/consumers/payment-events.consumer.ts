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
 * Consumer for Payment-related events from RabbitMQ.
 */
@Injectable()
export class PaymentEventsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentEventsConsumer.name);
  }

  @EventPattern(EVENT_PATTERNS.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`💰 Received PAYMENT_SUCCEEDED event for user ${data.userId}`);

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

  @EventPattern(EVENT_PATTERNS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`❌ Received PAYMENT_FAILED event for user ${data.userId}`);

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
