import { Injectable, Logger } from '@nestjs/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Handler for In-App notifications.
 * Since In-App notifications are persisted to the database during the creation phase,
 * this handler primarily acts as a confirmation step and placeholder for real-time 
 * push via WebSockets or SSE.
 */
@Injectable()
export class InAppHandler implements INotificationHandler {
  private readonly logger = new Logger(InAppHandler.name);

  /**
   * Confirms In-App notification "delivery".
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    this.logger.log(`📥 In-App notification ${notification.id} is ready for user ${notification.userId}`);
    
    // In-App delivery is considered "sent" once it's available in the DB for the user to fetch.
    // Future integration: Trigger a WebSocket/SSE broadcast here.
    
    return Promise.resolve();
  }

  /**
   * This handler only supports the IN_APP channel.
   */
  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.IN_APP;
  }
}
