import { DataSource } from 'typeorm';
import { Category } from './src/catalog/entities/category.entity';
import { Product } from './src/catalog/entities/product.entity';
import { Order } from './src/orders/entities/order.entity';
import { OrderStatus } from '@repo/contracts';
import { OrderItem } from './src/orders/entities/order-item.entity';
import { Payment, PaymentStatus } from './src/payments/entities/payment.entity';
import { ServiceHealthLog } from './src/admin/entities/service-health-log.entity';
import * as dotenv from 'dotenv';
import * as dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/catalog_order_db',
  entities: [Category, Product, Order, OrderItem, Payment, ServiceHealthLog],
  synchronize: false,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function main() {
  await AppDataSource.initialize();
  console.log('📦 Database initialized for seeding');

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const healthRepo = AppDataSource.getRepository(ServiceHealthLog);

  const targetClerkId = 'user_3BCsgam3vcHeYJhbLmw6271I4xT';

  // 1. Ensure Categories and Products exist
  let electronics = await categoryRepo.findOne({ where: { slug: 'electronics' } });
  electronics ??= await categoryRepo.save(categoryRepo.create({ name: 'Electronics', slug: 'electronics', description: 'Gadgets' }));

  let laptop = await productRepo.findOne({ where: { slug: 'laptop-pro' } });
  if (laptop) {
    // Update existing product to be owned by the target user
    laptop.sellerId = targetClerkId;
    laptop.status = 'APPROVED';
    await productRepo.save(laptop);
    console.log('✅ Laptop Pro ownership updated');
  } else {
    laptop = await productRepo.save(productRepo.create({ 
      name: 'Laptop Pro', slug: 'laptop-pro', description: 'High performance laptop', 
      price: 1299.99, stockQuantity: 50, category: electronics,
      sellerId: targetClerkId,
      status: 'APPROVED',
      isActive: true
    }));
    console.log('✅ Laptop Pro product seeded with seller ownership');
  }

  // 2. Seed Health Logs
  const services = ['api-gateway', 'user-service', 'catalog-order-service', 'payment-service'];
  for (const svc of services) {
    const log = healthRepo.create({
      serviceName: svc,
      status: svc === 'payment-service' ? 'degraded' : 'healthy',
      latencyMs: svc === 'payment-service' ? 850 : 45 + Math.floor(Math.random() * 100),
      errorDetails: svc === 'payment-service' ? 'Stripe API latency spike' : undefined
    });
    await healthRepo.save(log);
  }
  console.log('✅ Service health logs seeded');

  // 3. Seed Orders for the target user
  const targetUserId = '019d0b6a-b3e4-70d6-a168-89e80598c929';
  
  const existingOrder = await orderRepo.findOne({ where: { userId: targetUserId } });
  if (existingOrder) {
    console.log(`ℹ️ Orders already exist for user ${targetUserId}`);
  } else {
    const order = orderRepo.create({
      userId: targetUserId,
      status: OrderStatus.DELIVERED,
      totalAmount: 1299.99,
      items: [
        { productId: laptop.id, quantity: 1, unitPrice: 1299.99 },
      ],
    });
    const savedOrder = await orderRepo.save(order);
    console.log(`✅ Order created for user ${targetUserId}`);

    // 3. Seed Payment
    const payment = paymentRepo.create({
      orderId: savedOrder.id,
      amount: 1299.99,
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: 'pi_manual_seed_' + Date.now(),
    });
    await paymentRepo.save(payment);
    console.log('✅ Payment created for order');
  }

  await AppDataSource.destroy();
  console.log('👋 Seeding script finished');
}

main().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
