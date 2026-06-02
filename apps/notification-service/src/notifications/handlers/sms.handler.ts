import { Injectable, Logger } from '@nestjs/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { TemplateService } from '../template.service';

/**
 * Mock handler for sending notifications via SMS.
 * In a production system, this would integrate with Twilio, MessageBird, etc.
 */
@Injectable()
export class SmsHandler implements INotificationHandler {
  private readonly logger = new Logger(SmsHandler.name);

  constructor(private templateService: TemplateService) {}

  /**
   * Mock sending an SMS.
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      this.logger.log(`📱 [MOCK] Sending SMS for notification ${notification.id} to user ${notification.userId}`);

      // 1. Render the template for SMS (usually shorter than Email)
      const { body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.SMS,
        {
          ...notification.metadata,
          userId: notification.userId,
        },
      );

      // 2. Mock the phone number retrieval
      const phone = notification.metadata?.phone || '+1234567890';

      // 3. Simulate SMS delivery
      this.logger.log(`[SMS MOCK] To: ${phone} | Content: ${body}`);
      
      // Simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      this.logger.log(`✅ [MOCK] SMS delivered successfully`);
    } catch (error) {
      this.logger.error(`❌ [MOCK] Failed to send SMS: ${error.message}`);
      throw error;
    }
  }

  /**
   * This handler only supports the SMS channel.
   */
  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.SMS;
  }
}
