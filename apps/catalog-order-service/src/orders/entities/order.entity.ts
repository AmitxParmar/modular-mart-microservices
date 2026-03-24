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

@Entity('orders')
export class Order extends BaseEntity {
  @Column('uuid')
  @Index()
  userId: string; // Logical foreign key pointing to the user in user-service

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('uuid', { nullable: true })
  shippingAddressId: string; // Logical foreign key

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
