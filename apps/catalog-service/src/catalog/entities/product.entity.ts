import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Category } from './category.entity';
import { ProductAttribute } from './product-attribute.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Index()
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductAttribute, (attribute) => attribute.product)
  attributes: ProductAttribute[];

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'seller_id', nullable: true })
  @Index()
  sellerId: string; // References Clerk User ID

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @Index()
  brand: string;

  @Column('decimal', { name: 'average_rating', precision: 2, scale: 1, default: 0 })
  @Index()
  averageRating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @Column({ name: 'discount_percentage', type: 'int', default: 0 })
  @Index()
  discountPercentage: number;
}
