import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/users/entities/user.entity';
import { Address } from './src/users/entities/address.entity';
import { Role } from './src/users/entities/role.entity';
import { Seller } from './src/users/entities/seller.entity';

config(); // Load .env file

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432',
  entities: [User, Address, Role, Seller],
  migrations: ['src/database/migrations/*.ts'],
});

