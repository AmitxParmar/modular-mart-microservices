import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { ChannelStatus } from '../enums/channel-status.enum';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Standardized response DTO for a single notification channel status.
 */
export class NotificationChannelResponseDto {
  channel: NotificationChannelType;
  status: ChannelStatus;
  sentAt?: Date;
  failureReason?: string;
}

/**
 * Standardized response DTO for a single notification.
 * Used for API responses to the frontend.
 */
export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  subject?: string;
  content?: string;
  metadata?: any;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  channels: NotificationChannelResponseDto[];
}
