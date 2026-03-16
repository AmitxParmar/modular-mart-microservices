import { DataSource } from 'typeorm';
import { User, UserRole } from './src/users/entities/user.entity';
import { Address } from './src/users/entities/address.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_service_db',
  entities: [User, Address],
  synchronize: false,
});

async function runSeed() {
  await AppDataSource.initialize();
  console.log('Database connected successfully.');

  const userRepository = AppDataSource.getRepository(User);
  const addressRepository = AppDataSource.getRepository(Address);

  // Seed Admin
  let admin = await userRepository.findOne({ where: { email: 'admin@example.com' } });
  if (!admin) {
    admin = userRepository.create({
      clerkId: 'admin_dummy_clerk_id',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);
    console.log('Admin user seeded.');
  } else {
    console.log('Admin user already exists.');
  }

  // Seed Customer
  let customer = await userRepository.findOne({ where: { email: 'customer@example.com' } });
  if (!customer) {
    customer = userRepository.create({
      clerkId: 'customer_dummy_clerk_id',
      email: 'customer@example.com',
      firstName: 'Customer',
      lastName: 'User',
      role: UserRole.CUSTOMER,
    });
    customer = await userRepository.save(customer);
    console.log('Customer user seeded.');

    // Seed Address for Customer
    const address = addressRepository.create({
      user: customer,
      street: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      isDefault: true,
    });
    await addressRepository.save(address);
    console.log('Customer address seeded.');
  } else {
    console.log('Customer user already exists.');
  }

  await AppDataSource.destroy();
  console.log('Database connection closed.');
}

runSeed().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
