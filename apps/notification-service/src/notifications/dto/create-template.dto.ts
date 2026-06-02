import { IsEnum, IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * DTO for creating a new notification template.
 */
export class CreateTemplateDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationChannelType)
  channel: NotificationChannelType;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
