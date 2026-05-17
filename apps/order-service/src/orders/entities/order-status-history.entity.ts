import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { OrderStatus } from '@repo/contracts';
import { Order } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @Column({ name: 'order_id', type: 'uuid' })
  @Index()
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;
}
