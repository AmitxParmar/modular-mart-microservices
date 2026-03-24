import { DataSource } from 'typeorm';
import { Category } from './src/catalog/entities/category.entity';
import { Product } from './src/catalog/entities/product.entity';
import * as dotenv from 'dotenv';
import * as dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/catalog_order_db',
  entities: [Category, Product],
  synchronize: true, // Use synchronize: true ONLY for seeding scripts in dev
  logging: true,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? true : false,
});

async function main() {
  await AppDataSource.initialize();
  console.log('📦 Database initialized for seeding');

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);

  await AppDataSource.query('TRUNCATE TABLE products CASCADE;');
  await AppDataSource.query('TRUNCATE TABLE categories CASCADE;');

  // Seed Categories
  const catElectronics = categoryRepo.create({ name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' });
  const catClothing = categoryRepo.create({ name: 'Clothing', slug: 'clothing', description: 'Apparel and accessories' });
  const catHome = categoryRepo.create({ name: 'Home', slug: 'home', description: 'Furniture and decor' });

  await categoryRepo.save([catElectronics, catClothing, catHome]);
  console.log('✅ Categories seeded');

  // Seed Products
  const products = [
    productRepo.create({ name: 'Laptop Pro', slug: 'laptop-pro', description: 'High performance laptop', price: 1299.99, stockQuantity: 50, category: catElectronics }),
    productRepo.create({ name: 'Wireless Mouse', slug: 'wireless-mouse', description: 'Ergonomic wireless mouse', price: 49.99, stockQuantity: 150, category: catElectronics }),
    productRepo.create({ name: 'Cotton T-Shirt', slug: 'cotton-tshirt', description: '100% Cotton everyday tee', price: 19.99, stockQuantity: 200, category: catClothing }),
    productRepo.create({ name: 'Denim Jeans', slug: 'denim-jeans', description: 'Classic blue jeans', price: 59.99, stockQuantity: 100, category: catClothing }),
    productRepo.create({ name: 'Coffee Table', slug: 'coffee-table', description: 'Modern wooden coffee table', price: 199.99, stockQuantity: 20, category: catHome }),
  ];

  await productRepo.save(products);
  console.log('✅ Products seeded');

  await AppDataSource.destroy();
  console.log('👋 Seeding complete');
}

main().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
