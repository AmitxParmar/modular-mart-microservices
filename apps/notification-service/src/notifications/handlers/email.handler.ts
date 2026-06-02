import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
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
  private readonly logger = new Logger(EmailHandler.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private templateService: TemplateService,
  ) {
    // 1. Initialize the Nodemailer transporter using SMTP settings from config
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465, // true for 465, false for other ports
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
      this.logger.log(`📧 Attempting to send Email for notification ${notification.id} to user ${notification.userId}`);

      // 1. Render the template for Email
      const { subject, body } = await this.templateService.renderTemplate(
        notification.type,
        NotificationChannelType.EMAIL,
        {
          ...notification.metadata,
          userId: notification.userId,
          id: notification.id,
        },
      );

      // 2. Prepare the email options
      // Note: In a real app, we'd fetch the user's email address from User Service
      // For this demo, we'll use a placeholder if metadata doesn't have it
      const to = notification.metadata?.email || 'user@example.com';
      const from = this.configService.get<string>('SMTP_FROM', 'Modular Mart <noreply@modularmart.com>');

      // 3. Send the email
      await this.transporter.sendMail({
        from,
        to,
        subject: subject || notification.subject || 'New Notification from Modular Mart',
        html: body,
      });

      this.logger.log(`✅ Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send Email: ${error.message}`, error.stack);
      throw error; // Re-throw to be handled by the delivery worker (for retries)
    }
  }

  /**
   * This handler only supports the EMAIL channel.
   */
  supports(channelType: NotificationChannelType): boolean {
    return channelType === NotificationChannelType.EMAIL;
  }
}
