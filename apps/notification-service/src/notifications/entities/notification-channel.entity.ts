import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// fallow-ignore-next-line circular-dependency
import { Notification } from './notification.entity';
import { NotificationChannelType } from '../enums/notification-channel.enum';
import { ChannelStatus } from '../enums/channel-status.enum';

/**
 * Tracks delivery status for a specific channel (Email, SMS, etc.)
 * linked to a parent Notification.
 */
@Entity('notification_channels')
export class NotificationChannel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Link to the parent notification record
  @Column({ name: 'notification_id' })
  @Index()
  notificationId!: string;

  @ManyToOne(() => Notification, (notification) => notification.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;

  // The delivery channel (e.g., EMAIL, PUSH)
  @Column({
    type: 'enum',
    enum: NotificationChannelType,
  })
  channel!: NotificationChannelType;

  // Current status of delivery for this channel
  @Column({
    type: 'enum',
    enum: ChannelStatus,
    default: ChannelStatus.PENDING,
  })
  @Index('IDX_NOTIFICATION_PENDING_RETRYING', {
    where: `"status" IN ('PENDING', 'RETRYING')`,
  })
  status!: ChannelStatus;

  // Timestamp of when the message was successfully sent
  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt!: Date;

  // Records failure details if delivery fails
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string;

  // Retry management
  @Column({ name: 'retry_count', default: 0 })
  retryCount!: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries!: number;

  // Database audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
