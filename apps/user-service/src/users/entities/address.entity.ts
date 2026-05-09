import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { User } from './user.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @Index()
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column() street: string;
  @Column() city: string;
  @Column() state: string;
  @Column({ name: 'postal_code' }) postalCode: string;
  @Column() country: string;
  @Column({ name: 'is_default', default: false }) isDefault: boolean;
}
