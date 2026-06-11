import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Product } from './product.entity';

@Entity('product_attributes')
@Index(['attributeName', 'attributeValue'])
export class ProductAttribute extends BaseEntity {
  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'attribute_name' })
  @Index()
  attributeName: string;

  @Column({ name: 'attribute_value' })
  @Index()
  attributeValue: string;
}
