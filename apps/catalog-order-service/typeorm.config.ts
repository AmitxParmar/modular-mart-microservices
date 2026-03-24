import { DataSource } from 'typeorm';
import { Category } from './src/catalog/entities/category.entity';
import { Product } from './src/catalog/entities/product.entity';
import { Order } from './src/orders/entities/order.entity';
import { OrderItem } from './src/orders/entities/order-item.entity';
import { Payment } from './src/payments/entities/payment.entity';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/catalog_order_db',
  entities: [Category, Product, Order, OrderItem, Payment],
  migrations: ['src/migrations/*.ts'],
});
