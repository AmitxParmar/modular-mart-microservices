import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { User } from './user.entity';

@Entity('sellers')
export class Seller extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  businessName: string;

  @Column({ unique: true })
  businessEmail: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'SUSPENDED'],
    default: 'PENDING',
  })
  status: string;

  @Column('decimal', { precision: 5, scale: 2, default: 10.00 })
  commissionRate: number;
}
