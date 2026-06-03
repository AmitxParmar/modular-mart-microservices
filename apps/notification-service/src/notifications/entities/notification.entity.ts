import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationChannel } from './notification-channel.entity';

/**
 * Core Notification entity representing a message sent to a user.
 * Stores the content and metadata of the notification.
 */
@Entity('notifications')
export class Notification {
  // Use UUID for primary key to ensure uniqueness across distributed systems
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // External User ID (likely from Clerk)
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  // Type of notification (e.g., ORDER_CREATED)
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  // Priority level for delivery (CRITICAL, HIGH, BULK)
  @Column({
    type: 'enum',
    enum: NotificationPriority,
  })
  priority: NotificationPriority;

  // Optional subject line for channels like Email
  @Column({ nullable: true })
  subject: string;

  // Main content of the notification (can be string or JSON)
  @Column({ type: 'text', nullable: true })
  content: string;

  // Additional structured data related to the notification (e.g., orderId)
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  // Optional time for scheduled delivery
  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  // Tracks if the user has seen the notification in the UI
  @Column({ name: 'is_read', default: false })
  @Index({ where: '"is_read" = false' })
  isRead: boolean;

  // Timestamp of when the notification was marked as read
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  // Database audit fields
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // One notification can be delivered via multiple channels
  @OneToMany(() => NotificationChannel, (channel) => channel.notification, {
    cascade: true,
  })
  channels: NotificationChannel[];
}
