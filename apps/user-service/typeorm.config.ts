import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/users/entities/user.entity';
import { Address } from './src/users/entities/address.entity';

config(); // Load .env file

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/user_service_db',
  entities: [User, Address],
  migrations: ['src/database/migrations/*.ts'],
});
