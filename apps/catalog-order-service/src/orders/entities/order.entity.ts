import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { OrderItem } from './order-item.entity';
import { ShippingAddressSnapshot } from '../dto/create-order.dto';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    name: 'shipping_address_snapshot',
    type: 'jsonb',
    nullable: true,
  })
  shippingAddressSnapshot: ShippingAddressSnapshot | null;

  @Column({ name: 'customer_email_snapshot', type: 'text', nullable: true })
  customerEmailSnapshot: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    enumName: 'order_status',
  })
  status: OrderStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'shipping_address_id', type: 'uuid', nullable: true })
  shippingAddressId: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
