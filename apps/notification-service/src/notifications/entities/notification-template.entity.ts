import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationChannelType } from '../enums/notification-channel.enum';

/**
 * Stores message templates with Handlebars placeholders.
 * Allows different content per channel for the same notification type.
 */
@Entity('notification_templates')
@Unique(['type', 'channel'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // The event type this template is for
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  // The delivery channel this template is optimized for
  @Column({
    type: 'enum',
    enum: NotificationChannelType,
  })
  channel!: NotificationChannelType;

  // Optional subject line template (supports {{placeholders}})
  @Column({ nullable: true })
  subject!: string;

  // Main body template (supports {{placeholders}})
  @Column({ type: 'text' })
  body!: string;

  // Allows deactivating templates without deleting them
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // Database audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
