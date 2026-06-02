import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PinoLogger } from '@repo/common';
import { INotificationHandler } from './notification-handler.interface';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { TemplateService } from '../template.service';

/**
 * Handler for sending notifications via Email using Nodemailer.
 */
@Injectable()
export class EmailHandler implements INotificationHandler {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private templateService: TemplateService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailHandler.name);
    
    // Initialize the Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  /**
   * Sends the notification via Email.
   */
  async send(notification: Notification, channel: NotificationChannel): Promise<void> {
    try {
      this.logger.info(`📧 Attempting to send Email for notification ${notification.id} to user ${notification.userId}`);

      const { subject, body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.EMAIL,
        {
          ...notification.metadata,
          userId: notification.userId,
          id: notification.id,
        },
      );

      const to = notification.metadata?.email || 'user@example.com';
      const from = this.configService.get<string>('SMTP_FROM', 'Modular Mart <noreply@modularmart.com>');

      await this.transporter.sendMail({
        from,
        to,
        subject: subject || notification.subject || 'New Notification from Modular Mart',
        html: body,
      });

      this.logger.info(`✅ Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send Email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * This handler only supports the EMAIL channel.
   */
  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.EMAIL;
  }
}
