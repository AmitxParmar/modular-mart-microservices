import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @Index()
  order: Order;

  @Column('uuid')
  productId: string; // Logical FK pointing to Product

  @Column({ type: 'int' })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;
}
