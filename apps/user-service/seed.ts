import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Address } from './src/users/entities/address.entity';
import { Role } from './src/users/entities/role.entity';
import { Seller } from './src/users/entities/seller.entity';
import * as dotenv from 'dotenv';
import * as dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/user_service_db',
  entities: [User, Address, Role, Seller],
  synchronize: false,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function runSeed() {
  await AppDataSource.initialize();
  console.log('Database connected successfully.');

  const userRepository = AppDataSource.getRepository(User);
  const addressRepository = AppDataSource.getRepository(Address);
  const roleRepository = AppDataSource.getRepository(Role);
  const sellerRepository = AppDataSource.getRepository(Seller);

  // 1. Seed Roles
  const rolesToSeed = [
    { name: 'CUSTOMER', description: 'Standard buyer account' },
    { name: 'SELLER', description: 'Vendor account for managing products' },
    { name: 'ADMIN', description: 'System administrator with full access' }
  ];

  const roleMap: Record<string, Role> = {};

  for (const roleData of rolesToSeed) {
    let role = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`Role ${roleData.name} seeded.`);
    }
    roleMap[roleData.name] = (await roleRepository.findOne({ where: { name: roleData.name } }))!;
  }

  // 2. Ensure User exists with provided ID
  const targetUserId = '019d0b6a-b3e4-70d6-a168-89e80598c929';
  const targetClerkId = 'user_3BCsgam3vcHeYJhbLmw6271I4xT';
  
  let user = await userRepository.findOne({ 
    where: { id: targetUserId },
    relations: ['roles']
  });

  if (!user) {
    user = await userRepository.findOne({ where: { clerkId: targetClerkId }, relations: ['roles'] });
    if (!user) {
      user = userRepository.create({
        id: targetUserId,
        clerkId: targetClerkId,
        email: 'amitparmar901@gmail.com',
        firstName: 'Amit',
        lastName: 'Parmar',
      });
    }
  }

  // Assign all roles for testing purposes
  user.roles = [roleMap['ADMIN'], roleMap['CUSTOMER'], roleMap['SELLER']];
  await userRepository.save(user);
  console.log(`User ${targetUserId} verified and linked to all roles.`);

  // 3. Seed Seller Profile
  let seller = await sellerRepository.findOne({ where: { userId: targetUserId } });
  if (!seller) {
    seller = sellerRepository.create({
      userId: targetUserId,
      businessName: 'Modular Solutions Ltd',
      businessEmail: 'amitparmar901@gmail.com',
      taxId: 'TX-9988-77',
      status: 'APPROVED',
      commissionRate: 5.00
    });
    await sellerRepository.save(seller);
    console.log(`Seller profile for user ${targetUserId} seeded.`);
  }

  // 4. Seed Multiple Dummy Addresses
  const addresses = [
    { street: '123 Tech Lane', city: 'Silicon Valley', state: 'CA', postalCode: '94025', country: 'USA', isDefault: true },
  ];

  for (const addrData of addresses) {
    const exists = await addressRepository.findOne({ where: { street: addrData.street, user: { id: targetUserId } } });
    if (!exists) {
      const address = addressRepository.create({ ...addrData, user });
      await addressRepository.save(address);
      console.log(`Address "${addrData.street}" seeded.`);
    }
  }

  console.log('User-Service Seeding completed successfully.');
  await AppDataSource.destroy();
}

runSeed().catch((error) => {
  console.error('Error during seeding:', error);
  process.exit(1);
});

