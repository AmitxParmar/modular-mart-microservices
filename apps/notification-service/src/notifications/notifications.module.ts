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
import { OrderEventsConsumer } from './consumers/order-events.consumer';
import { PaymentEventsConsumer } from './consumers/payment-events.consumer';
import { CatalogEventsConsumer } from './consumers/catalog-events.consumer';
import { UserEventsConsumer } from './consumers/user-events.consumer';

/**
 * Notifications Module.
 * Registers all entities, providers, and event consumers.
 */
@Module({
  imports: [
    // Register entities with TypeORM
    TypeOrmModule.forFeature([
      Notification,
      NotificationChannel,
      ProcessedMessage,
      NotificationTemplate,
      NotificationPreference,
    ]),
  ],
  controllers: [
    NotificationsController,
    // Note: Consumers using @EventPattern are registered as controllers in Hybrid Apps
    OrderEventsConsumer,
    PaymentEventsConsumer,
    CatalogEventsConsumer,
    UserEventsConsumer,
  ],
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
  ],
})
export class NotificationsModule {}
