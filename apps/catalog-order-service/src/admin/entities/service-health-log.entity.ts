import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

@Entity('service_health_logs')
export class ServiceHealthLog extends BaseEntity {
  @Column()
  @Index()
  serviceName: string;

  @Column()
  status: string; // healthy, degraded, down

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  @Column({ type: 'text', nullable: true })
  errorDetails: string;
}
