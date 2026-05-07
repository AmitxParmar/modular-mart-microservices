import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Category } from './category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Index()
  category: Category;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;
}
