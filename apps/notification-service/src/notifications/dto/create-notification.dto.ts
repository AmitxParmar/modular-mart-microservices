import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsDateString, IsUUID } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * DTO for creating a new notification.
 * Used for internal service-to-service calls.
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  scheduledAt?: Date;

  // Optional list of channels to override defaults
  @IsEnum(NotificationChannelType, { each: true })
  @IsOptional()
  channels?: NotificationChannelType[];
}
