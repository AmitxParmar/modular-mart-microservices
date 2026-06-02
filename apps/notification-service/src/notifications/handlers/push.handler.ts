import { Injectable, Logger } from '@nestjs/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { TemplateService } from '../template.service';

/**
 * Mock handler for sending Push Notifications.
 * In a production system, this would integrate with Firebase (FCM), Expo, etc.
 */
@Injectable()
export class PushHandler implements INotificationHandler {
  private readonly logger = new Logger(PushHandler.name);

  constructor(private templateService: TemplateService) {}

  /**
   * Mock sending a Push Notification.
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      this.logger.log(`🔔 [MOCK] Sending Push for notification ${notification.id} to user ${notification.userId}`);

      // 1. Render the template for Push
      const { subject, body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.PUSH,
        {
          ...notification.metadata,
          userId: notification.userId,
        },
      );

      // 2. Simulate Push Notification delivery
      this.logger.log(`[PUSH MOCK] Title: ${subject} | Body: ${body}`);
      
      // Simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      this.logger.log(`✅ [MOCK] Push Notification delivered successfully`);
    } catch (error) {
      this.logger.error(`❌ [MOCK] Failed to send Push: ${error.message}`);
      throw error;
    }
  }

  /**
   * This handler only supports the PUSH channel.
   */
  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.PUSH;
  }
}
