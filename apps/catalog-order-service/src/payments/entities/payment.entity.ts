import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column('uuid')
  @Index()
  orderId: string; // Logical foreign key pointing to Order

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  stripePaymentIntentId: string; // For syncing with Stripe
}
