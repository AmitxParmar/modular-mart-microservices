import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PinoLogger } from '@repo/common';
import { NotificationsService } from '../notifications.service';
import { ProcessedMessage } from '../entities/processed-message.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { EVENT_PATTERNS, UserCreatedEvent } from '@repo/contracts';

/**
 * Consumer for User-related events from RabbitMQ.
 */
@Injectable()
export class UserEventsConsumer {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepository: Repository<ProcessedMessage>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserEventsConsumer.name);
  }

  @EventPattern(EVENT_PATTERNS.USER_CREATED)
  async handleUserCreated(
    @Payload() data: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const messageId = context.getMessage().properties.messageId;
    this.logger.info(`👤 Received USER_CREATED event for user ${data.userId}`);

    if (await this.isAlreadyProcessed(messageId)) return;

    await this.notificationsService.createNotification({
      userId: data.userId,
      type: NotificationType.USER_REGISTERED,
      priority: NotificationPriority.BULK,
      subject: 'Welcome to Modular Mart!',
      content: `Hi ${data.firstName || 'there'}, thanks for joining us!`,
      metadata: {
        userId: data.userId,
        email: data.email,
        name: data.firstName,
      },
    });

    await this.markAsProcessed(messageId, EVENT_PATTERNS.USER_CREATED);
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
