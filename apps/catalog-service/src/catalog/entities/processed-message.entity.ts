import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('processed_messages')
export class ProcessedMessage {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ name: 'event_type', type: 'text', nullable: true })
  eventType?: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
