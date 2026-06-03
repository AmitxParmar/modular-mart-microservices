import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@repo/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Handler for In-App notifications.
 */
@Injectable()
export class InAppHandler implements INotificationHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InAppHandler.name);
  }

  /**
   * Confirms In-App notification "delivery".
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    this.logger.info(`📥 In-App notification ${notification.id} is ready for user ${notification.userId}`);
    return Promise.resolve();
  }

  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.IN_APP;
  }
}
