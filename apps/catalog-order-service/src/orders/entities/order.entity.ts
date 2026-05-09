import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Mapping updated to snake_case
@Entity('orders')
export class Order extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string; // Logical foreign key pointing to the Clerk ID

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING, enumName: 'order_status' })
  status: OrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'shipping_address_id', type: 'uuid', nullable: true })
  shippingAddressId: string; // Logical foreign key

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
