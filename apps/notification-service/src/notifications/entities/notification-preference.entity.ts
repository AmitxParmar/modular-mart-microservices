import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Stores user-specific notification preferences.
 * Controls which channels are enabled and if marketing is allowed.
 */
@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // External User ID (Clerk)
  @Column({ name: 'user_id', unique: true })
  @Index()
  userId: string;

  // Channel toggle settings
  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'sms_enabled', default: false })
  smsEnabled: boolean;

  @Column({ name: 'push_enabled', default: true })
  pushEnabled: boolean;

  // Toggle for promotional/marketing notifications
  @Column({ name: 'marketing_enabled', default: false })
  marketingEnabled: boolean;

  // Database audit fields
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
