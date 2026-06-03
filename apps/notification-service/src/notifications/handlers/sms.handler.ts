import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@repo/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { TemplateService } from '../template.service';

/**
 * Mock handler for sending notifications via SMS.
 */
@Injectable()
export class SmsHandler implements INotificationHandler {
  constructor(
    private templateService: TemplateService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SmsHandler.name);
  }

  /**
   * Mock sending an SMS.
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      this.logger.info(`📱 [MOCK] Sending SMS for notification ${notification.id} to user ${notification.userId}`);

      const { body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.SMS,
        {
          ...notification.metadata,
          userId: notification.userId,
        },
      );

      const phone = notification.metadata?.phone || '+1234567890';
      this.logger.info(`[SMS MOCK] To: ${phone} | Content: ${body}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      this.logger.info(`✅ [MOCK] SMS delivered successfully`);
    } catch (error) {
      this.logger.error(`❌ [MOCK] Failed to send SMS: ${error.message}`);
      throw error;
    }
  }

  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.SMS;
  }
}
