import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables from .env file into process.env
// This is necessary because the TypeORM CLI runs outside the NestJS context
config();

/**
 * TypeORM Data Source configuration
 * This file is used by the TypeORM CLI to run migrations and by the application
 * to establish a connection to the PostgreSQL database.
 */
export default new DataSource({
  // Specify the database type as PostgreSQL
  type: 'postgres',
  
  // Use the connection string from environment variables
  // neonatal or local postgres connection string
  url: process.env.DATABASE_URL,
  
  // Pattern to find all entity files in the src directory
  // .entity.ts files define the database schema mapping
  entities: ['src/**/*.entity.ts'],
  
  // Pattern to find all migration files
  // Migrations are used to version control the database schema
  migrations: ['src/migrations/*.ts'],
  
  // Disable synchronize in development/production to prevent accidental data loss
  // Always use migrations to update the database schema
  synchronize: false,
  
  // Enable logging for SQL queries in development to help with debugging
  logging: process.env.NODE_ENV === 'development',
});
