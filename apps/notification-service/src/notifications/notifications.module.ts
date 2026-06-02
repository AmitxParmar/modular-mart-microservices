import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { ProcessedMessage } from './entities/processed-message.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { TemplateService } from './template.service';
import { PreferenceService } from './preference.service';
import { EmailHandler } from './handlers/email.handler';
import { SmsHandler } from './handlers/sms.handler';
import { PushHandler } from './handlers/push.handler';
import { InAppHandler } from './handlers/in-app.handler';
import { NotificationHandlerFactory } from './handlers/notification-handler-factory.service';

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
  providers: [
    NotificationsService,
    TemplateService,
    PreferenceService,
    // Channel Handlers
    EmailHandler,
    SmsHandler,
    PushHandler,
    InAppHandler,
    NotificationHandlerFactory,
  ],
  exports: [
    NotificationsService,
    TemplateService,
    PreferenceService,
    NotificationHandlerFactory,
  ], // Export services for use in other modules (e.g., event consumers, delivery workers)
})
export class NotificationsModule {}
