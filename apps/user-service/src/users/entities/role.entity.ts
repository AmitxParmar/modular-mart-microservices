import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@repo/database';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string; // CUSTOMER, SELLER, ADMIN

  @Column({ type: 'text', nullable: true })
  description: string;
}
