import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Interface that all notification delivery handlers must implement.
 * This ensures a consistent way to send notifications across different channels.
 */
export interface INotificationHandler {
  /**
   * Sends the notification through the specific channel.
   * 
   * @param notification The parent notification entity
   * @param channel The channel-specific delivery record
   */
  send(notification: Notification, channel: NotificationChannel): Promise<void>;

  /**
   * Returns whether this handler supports the given channel type.
   */
  supports(channelType: NotificationChannelType): boolean;
}
