import { DataSource } from 'typeorm';
import { NotificationTemplate } from './src/notifications/entities/notification-template.entity';
import { NotificationType } from './src/notifications/enums/notification-type.enum';
import { NotificationChannelType } from './src/notifications/enums/notification-channel.enum';
import { config } from 'dotenv';

config();

/**
 * Seed script to populate the database with default notification templates.
 * This is essential for the service to function correctly without manual setup.
 */
async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [NotificationTemplate],
  });

  try {
    await dataSource.initialize();
    console.log('🌱 Starting database seeding...');

    const templateRepository = dataSource.getRepository(NotificationTemplate);

    // Default templates to seed
    const defaultTemplates = [
      // 1. ORDER_CREATED
      {
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannelType.EMAIL,
        subject: 'Order Confirmed: #{{orderId}}',
        body: '<h1>Thank you for your order!</h1><p>Your order #{{orderId}} for {{totalAmount}} has been placed.</p>',
      },
      {
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannelType.IN_APP,
        body: 'Your order #{{orderId}} was successfully placed!',
      },
      
      // 2. PAYMENT_FAILED
      {
        type: NotificationType.PAYMENT_FAILED,
        channel: NotificationChannelType.EMAIL,
        subject: 'Action Required: Payment Failed',
        body: '<h1>Payment Issue</h1><p>We couldn\'t process your payment for order #{{orderId}}. Please check your billing details.</p>',
      },
      {
        type: NotificationType.PAYMENT_FAILED,
        channel: NotificationChannelType.SMS,
        body: 'Modular Mart: Payment for order #{{orderId}} failed. Please update your payment method.',
      },

      // 3. USER_REGISTERED
      {
        type: NotificationType.USER_REGISTERED,
        channel: NotificationChannelType.EMAIL,
        subject: 'Welcome to Modular Mart!',
        body: '<h1>Welcome {{name}}!</h1><p>We\'re excited to have you on board. Start browsing our catalog today!</p>',
      },
    ];

    for (const data of defaultTemplates) {
      const existing = await templateRepository.findOne({
        where: { type: data.type, channel: data.channel },
      });

      if (!existing) {
        await templateRepository.save(templateRepository.create(data));
        console.log(`✅ Seeded template: ${data.type} [${data.channel}]`);
      } else {
        console.log(`ℹ️ Template already exists: ${data.type} [${data.channel}]`);
      }
    }

    console.log('🌿 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
