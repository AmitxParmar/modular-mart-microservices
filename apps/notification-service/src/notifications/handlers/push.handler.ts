import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@repo/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { TemplateService } from '../template.service';

/**
 * Mock handler for sending Push Notifications.
 */
@Injectable()
export class PushHandler implements INotificationHandler {
  constructor(
    private templateService: TemplateService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PushHandler.name);
  }

  /**
   * Mock sending a Push Notification.
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      this.logger.info(`🔔 [MOCK] Sending Push for notification ${notification.id} to user ${notification.userId}`);

      const { subject, body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.PUSH,
        {
          ...notification.metadata,
          userId: notification.userId,
        },
      );

      this.logger.info(`[PUSH MOCK] Title: ${subject} | Body: ${body}`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      this.logger.info(`✅ [MOCK] Push Notification delivered successfully`);
    } catch (error) {
      this.logger.error(`❌ [MOCK] Failed to send Push: ${error.message}`);
      throw error;
    }
  }

  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.PUSH;
  }
}
