import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment record — owned exclusively by payment-service.
 * orderId is a logical foreign key pointing to the order in order-service.
 * No TypeORM relation is defined — services are decoupled by design.
 */
@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  @Index()
  orderId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    enumName: 'payment_status',
  })
  status: PaymentStatus;

  @Column({ name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string;
}
