import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Idempotency table to ensure we don't process the same RabbitMQ message twice.
 * This implements the "Exactly-Once" processing semantic (at the consumer level).
 */
@Entity('processed_messages')
export class ProcessedMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Unique ID from the incoming RabbitMQ message
  @Column({ name: 'message_id', unique: true })
  @Index()
  messageId!: string;

  // Type of event that was processed
  @Column({ name: 'event_type' })
  eventType!: string;

  // Audit field for when the message was successfully processed
  @CreateDateColumn({ name: 'processed_at' })
  processedAt!: Date;
}
