import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

/**
 * Notifications Module.
 * Registers all entities and providers related to notifications.
 */
@Module({
  imports: [
    // Register entities with TypeORM so they can be injected as repositories
    TypeOrmModule.forFeature([
      Notification,
      NotificationChannel,
      ProcessedMessage,
      NotificationTemplate,
      NotificationPreference,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Export so other modules can send notifications
})
export class NotificationsModule {}
