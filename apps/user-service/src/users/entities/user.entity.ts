import {
  Entity,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Address } from './address.entity';
import { Role } from './role.entity';

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

  @ManyToMany(() => Role)
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];
}
