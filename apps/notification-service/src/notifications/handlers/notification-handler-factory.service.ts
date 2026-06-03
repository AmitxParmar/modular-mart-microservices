import { Injectable, NotFoundException } from '@nestjs/common';
import { INotificationHandler } from './notification-handler.interface';
import { EmailHandler } from './email.handler';
import { SmsHandler } from './sms.handler';
import { PushHandler } from './push.handler';
import { InAppHandler } from './in-app.handler';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Factory service that resolves the appropriate delivery handler
 * based on the requested notification channel.
 */
@Injectable()
export class NotificationHandlerFactory {
  private handlers: INotificationHandler[];

  constructor(
    private emailHandler: EmailHandler,
    private smsHandler: SmsHandler,
    private pushHandler: PushHandler,
    private inAppHandler: InAppHandler,
  ) {
    // 1. Register all available handlers
    this.handlers = [
      this.emailHandler,
      this.smsHandler,
      this.pushHandler,
      this.inAppHandler,
    ];
  }

  /**
   * Returns the handler that supports the specified channel type.
   * 
   * @param channelType The channel to resolve a handler for
   * @throws NotFoundException if no handler is registered for the channel
   */
  getHandler(channelType: NotificationChannelType): INotificationHandler {
    const handler = this.handlers.find((h) => h.supports(channelType));

    if (!handler) {
      throw new NotFoundException(
        `No notification handler found for channel: ${channelType}`,
      );
    }

    return handler;
  }
}
