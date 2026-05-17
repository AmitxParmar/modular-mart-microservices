import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Product } from './product.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
