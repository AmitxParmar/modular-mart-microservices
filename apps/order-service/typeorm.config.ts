import { DataSource } from 'typeorm';
import { Order } from './src/orders/entities/order.entity';
import { OrderItem } from './src/orders/entities/order-item.entity';
import { OrderStatusHistory } from './src/orders/entities/order-status-history.entity';
import { OutboxEvent } from './src/orders/entities/outbox-event.entity';
import { ProcessedMessage } from './src/orders/entities/processed-message.entity';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/catalog_order_db',
  entities: [Order, OrderItem, OrderStatusHistory, OutboxEvent, ProcessedMessage],
  migrations: ['src/migrations/*.ts'],
});
