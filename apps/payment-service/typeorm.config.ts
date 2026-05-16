import { DataSource } from 'typeorm';
import { Payment } from './src/payments/entities/payment.entity';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/payment_db',
  entities: [Payment],
  migrations: ['src/migrations/*.ts'],
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});
