import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Address } from './address.entity';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index()
  clerkId: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

}
