import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { User } from './user.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @Index()
  user: User;

  @Column() street: string;
  @Column() city: string;
  @Column() state: string;
  @Column() postalCode: string;
  @Column() country: string;
  @Column({ default: false }) isDefault: boolean;
}
