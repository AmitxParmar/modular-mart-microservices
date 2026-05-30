import { DataSource } from 'typeorm';
import { Product } from './src/catalog/entities/product.entity';
import { Category } from './src/catalog/entities/category.entity';
import { ProcessedMessage } from './src/catalog/entities/processed-message.entity';
import { ServiceHealthLog } from './src/catalog/entities/service-health-log.entity';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/catalog_db',
  entities: [Product, Category, ProcessedMessage, ServiceHealthLog],
  migrations: ['src/migrations/*.ts'],
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});
